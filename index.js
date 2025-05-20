import { runChartinkScraper } from './dailygainer.js';
import { feed } from './feeddaily.js';

import { getDailyLosers } from './dailyloser.js';
import { feeddailyloser } from './feeddailyloser.js';

import { runMonthlyGainerScraper } from './monthly.js';
import { feedmonthly } from './feedmonthly.js';

import { getMonthlyLosers } from './monthlyloser.js';
import { feedmonthlyloser } from './feedmonthlyloser.js';

import {rundailygainer} from './prompt.js';
import {rundailyloser} from './prompt2.js';
import {runmonthlyloss} from './prompt3.js';
import {runmonthlygain} from './prompt4.js';
async function runAllTasksSequentially() {
  try {
    await runChartinkScraper();
    console.log('Daily Gainer scraping completed!');

     await feed();
    console.log('Daily Gainer feed completed!');

    await getDailyLosers();
    console.log('Daily Loser scraping completed!');

    await feeddailyloser();
    console.log('Daily Loser feed completed!');

    //await runMonthlyGainerScraper();
    //console.log('Monthly Gainer scraping completed!');

    //await feedmonthly();
    //console.log('Monthly Gainer feed completed!');

    //await getMonthlyLosers();
    //console.log('Monthly Loser scraping completed!');

   // await feedmonthlyloser();
    //console.log('Monthly Loser feed completed!');
    
    await rundailygainer();
    console.log('Prompt completed!');

    await rundailyloser()
    console.log('Prompt completed!');

    //await runmonthlyloss()
    //console.log('Prompt completed!');

    //await runmonthlygain()
    //console.log('Prompt completed!');

    console.log(' All tasks executed sequentially!');
  } catch (err) {
    console.error(' Error during task execution:', err);
  }
}

runAllTasksSequentially();

