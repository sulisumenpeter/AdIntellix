import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// We must dynamically load the queue client so env variables are ready before env.ts is parsed
import { redisConnection, createQueue } from './src/lib/queue/client';
import { Worker } from 'bullmq';

async function runTest() {
  console.log(`Starting Production Valkey Test`);
  
  try {
    const pingRes = await redisConnection.ping();
    console.log('[PASS] PING returned:', pingRes);

    await redisConnection.set('adintelix_test_key_prod', 'hello_prod');
    console.log('[PASS] SET test key successfully');

    const val = await redisConnection.get('adintelix_test_key_prod');
    console.log('[PASS] GET test key returned:', val);
    
    await redisConnection.del('adintelix_test_key_prod');
    console.log('[PASS] DEL test key successfully');

    const queueName = 'test-prod-queue';
    const testQueue = createQueue(queueName);
    let jobCompleted = false;

    const worker = new Worker(queueName, async (job) => {
      console.log(`[PASS] Worker received job: ${job.id} with data:`, job.data);
      return 'success';
    }, { connection: redisConnection });

    worker.on('completed', (job) => {
      console.log(`[PASS] Worker successfully acknowledged and completed job: ${job.id}`);
      jobCompleted = true;
    });

    const job = await testQueue.add('test-job', { testData: 'prod-queue' });
    console.log(`[PASS] Producer successfully enqueued test job: ${job.id}`);

    for (let i = 0; i < 20; i++) {
      if (jobCompleted) break;
      await new Promise(r => setTimeout(r, 500));
    }
    
    await worker.close();
    await testQueue.close();
    await redisConnection.quit();
    console.log('\n--- PRODUCTION VALKEY TEST SUMMARY: COMPLETE ---');
  } catch (error) {
    console.error('\n[FAIL] Valkey Test Error:', error);
    process.exit(1);
  }
}

runTest();
