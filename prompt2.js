import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import axios from 'axios';
import dotenv from 'dotenv'

dotenv.config();

const apikey=process.env.API_PROMPT_LOSER;
const dbConfig = {
  host: 'srv1856.hstgr.io',
  user: 'u218978860_fbcwE',
  password: 'EpMYWh5hjRPmy6eT',
  database: 'u218978860_cX3Xc',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
const wpApiUrl = 'https://profitbooking.in/wp-json/scraper/v1/stockedge-groq';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const pool = mysql.createPool(dbConfig);

// Utility function to parse quoted CSV correctly
function parseCSVLine(line) {
  const regex = /"([^"]*)"/g;
  const result = [];
  let match;
  while ((match = regex.exec(line))) {
    result.push(match[1]);
  }
  return result;
}

function extractStockNameFromCSV(filePath = './dailyloser.csv') {
  const csv = fs.readFileSync(filePath, 'utf-8');
  const lines = csv.trim().split('\n');

  const header = parseCSVLine(lines[0]);
  const stockNameIndex = header.indexOf('Stock Name');
  const symbolIndex = header.indexOf('Symbol');
  const changePercent = header.indexOf('% Chg');

  if (stockNameIndex === -1 || symbolIndex === -1) {
    throw new Error('Missing required columns: "Stock Name" or "Symbol"');
  }

  const companies = lines.slice(1).map(line => {
    const fields = parseCSVLine(line);
    return {
      name: fields[stockNameIndex],
      symbol: fields[symbolIndex],
      change:fields[changePercent],

    };
  });

  return companies;
}

async function getCompanyFeed(stockName) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query(
      `SELECT content
      FROM wp_stockedge_daily_loser_investigator
      WHERE stockName = ?
      AND date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
      AND date < CURDATE()
      ORDER BY date DESC;`,
      [stockName]
    );

    const feed = rows.map(row => row.content?.trim() || '').join(' || ');
    console.log(` Feed for ${stockName}:`, feed);
    return feed;
  } catch (error) {
    console.error(`DB error for ${stockName}:`, error.message);
    return '';
  } finally {
    if (connection) connection.release();
  }
}

async function classifyFeedWithGroq(stockName, feed, apikey) {
  const prompt = `You are a financial analyst. Analyze the following recent news and updates about the NSE-listed company "${stockName}":${feed}
From this feed, identify and give the **top 3 feed** why this company may be appearing as a daily loser in the stock market. Base your reasoning only on the feed content. Be concise and specific. 
From the above content, Find 3 reasons explaining the daily loser behaviour, and give each reason in 100 characters.`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'deepseek-r1-distill-llama-70b',
        messages: [
          { role: 'system', content: 'You are a financial analyst bot.' },
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apikey}`
        }
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`Groq API error for ${stockName}:`, error.response?.data || error.message);
    return 'Groq Error';
  }
}

function extractTop3Points(text) {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && /^[\d\*\-]/.test(line)); // lines starting with 1., *, -

  return lines.slice(0, 3).map(line => {
    // Remove leading bullet or number (e.g., "1. ", "* ", "- ")
    return line.replace(/^[\d\*\-\s\.]+/, '').trim();
  });
}

async function sendToWordPress(stock, stockName,changePercent, reasons, tag = 'dailyloser') {
  try {
    const response = await axios.post(wpApiUrl, {
      stock: stock,
      stockName: stockName,
      changePercent:changePercent,
      summary1: reasons[0] || 'No summary available',
      summary2: reasons[1] || 'No summary available',
      summary3: reasons[2] || 'No summary available',
      tag: tag
    });
    
    console.log(`Posted to WordPress for ${stockName}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`WordPress API error for ${stockName}:`, error.response?.data || error.message);
    return null;
  }
}

export async function rundailyloser() {

  const companies = extractStockNameFromCSV('./dailyloser.csv');

  for (const company of companies) {
    const feed = await getCompanyFeed(company.name);

    if (!feed) {
      console.log(` Skipping Groq analysis for ${company.name} due to empty feed.`);
      console.log('='.repeat(100));
      continue;
    }

    const rawResult = await classifyFeedWithGroq(company.name, feed, apikey);
    const cleanResult = rawResult.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    
    console.log(` For company ${company.name}, Groq classification is: ${cleanResult}`);
    
    const reasonsArray = extractTop3Points(cleanResult);
    console.log("Extracted top 3 reasons:", reasonsArray);
    if (reasonsArray.length === 3) {
    await sendToWordPress(company.symbol, company.name,company.change, reasonsArray);
    } else {
    console.warn(`Could not extract 3 reasons for ${company.name}, skipping WordPress posting.`);
}

    
    console.log('='.repeat(100));
    
    await delay(30000); 
  }
}



