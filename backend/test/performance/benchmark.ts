#!/usr/bin/env ts-node

/**
 * Performance Benchmark Tool
 * Runs comprehensive performance tests and generates report
 */

import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import * as fs from 'fs';
import * as path from 'path';

interface BenchmarkResult {
  name: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  requestsPerSecond: number;
}

class PerformanceBenchmark {
  private app: INestApplication;
  private authToken: string;
  private results: BenchmarkResult[] = [];

  async initialize() {
    console.log('🚀 Initializing Performance Benchmark...\n');
    
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();

    // Login
    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

    this.authToken = loginResponse.body.accessToken;
    console.log('✅ Authentication successful\n');
  }

  async runBenchmark(
    name: string,
    requestFn: () => Promise<any>,
    iterations: number = 100,
  ): Promise<BenchmarkResult> {
    console.log(`📊 Running benchmark: ${name} (${iterations} iterations)`);
    
    const times: number[] = [];
    let successCount = 0;

    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const reqStartTime = Date.now();
      
      try {
        await requestFn();
        const reqTime = Date.now() - reqStartTime;
        times.push(reqTime);
        successCount++;
      } catch (error) {
        times.push(Date.now() - reqStartTime);
      }
    }

    const totalTime = Date.now() - startTime;
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successCount / iterations) * 100;
    const requestsPerSecond = (iterations / totalTime) * 1000;

    const result: BenchmarkResult = {
      name,
      avgTime: Math.round(avgTime * 100) / 100,
      minTime,
      maxTime,
      successRate: Math.round(successRate * 100) / 100,
      requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
    };

    this.results.push(result);

    console.log(`  ✓ Avg: ${result.avgTime}ms`);
    console.log(`  ✓ Min: ${result.minTime}ms`);
    console.log(`  ✓ Max: ${result.maxTime}ms`);
    console.log(`  ✓ Success Rate: ${result.successRate}%`);
    console.log(`  ✓ RPS: ${result.requestsPerSecond}\n`);

    return result;
  }

  async runAllBenchmarks() {
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('           SMART ERP PERFORMANCE BENCHMARK\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Authentication
    await this.runBenchmark(
      'POST /auth/login',
      () => request(this.app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'Admin123!' }),
      50,
    );

    // Products
    await this.runBenchmark(
      'GET /products (list)',
      () => request(this.app.getHttpServer())
        .get('/products')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    await this.runBenchmark(
      'GET /products/:id (detail)',
      () => request(this.app.getHttpServer())
        .get('/products/1')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    await this.runBenchmark(
      'POST /products (create)',
      () => request(this.app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          sku: `BENCH-${Date.now()}-${Math.random()}`,
          name: 'Benchmark Product',
          price: 100000,
          cost: 80000,
          stock: 100,
        }),
      50,
    );

    // Orders
    await this.runBenchmark(
      'GET /orders (list)',
      () => request(this.app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    await this.runBenchmark(
      'POST /orders (create)',
      () => request(this.app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send({
          customerId: '1',
          orderDate: new Date().toISOString(),
          items: [
            { productId: '1', quantity: 5, unitPrice: 100000 },
          ],
        }),
      50,
    );

    // Dashboard
    await this.runBenchmark(
      'GET /dashboard/overview',
      () => request(this.app.getHttpServer())
        .get('/dashboard/overview')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    // Customers
    await this.runBenchmark(
      'GET /customers (list)',
      () => request(this.app.getHttpServer())
        .get('/customers')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    // Inventory
    await this.runBenchmark(
      'GET /inventory (list)',
      () => request(this.app.getHttpServer())
        .get('/inventory')
        .set('Authorization', `Bearer ${this.authToken}`),
      100,
    );

    // Reports
    await this.runBenchmark(
      'GET /reporting/sales',
      () => request(this.app.getHttpServer())
        .get('/reporting/sales?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${this.authToken}`),
      50,
    );
  }

  generateReport() {
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('                  BENCHMARK SUMMARY\n');
    console.log('═══════════════════════════════════════════════════════\n');

    // Sort by average time
    const sortedResults = [...this.results].sort((a, b) => a.avgTime - b.avgTime);

    console.log('Fastest Endpoints:');
    sortedResults.slice(0, 5).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name}: ${result.avgTime}ms`);
    });

    console.log('\nSlowest Endpoints:');
    sortedResults.slice(-5).reverse().forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name}: ${result.avgTime}ms`);
    });

    console.log('\nHighest Throughput:');
    const sortedByRPS = [...this.results].sort((a, b) => b.requestsPerSecond - a.requestsPerSecond);
    sortedByRPS.slice(0, 5).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name}: ${result.requestsPerSecond} req/s`);
    });

    // Calculate overall stats
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgTime, 0) / this.results.length;
    const avgSuccessRate = this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length;
    const totalRPS = this.results.reduce((sum, r) => sum + r.requestsPerSecond, 0);

    console.log('\nOverall Statistics:');
    console.log(`  Average Response Time: ${Math.round(avgResponseTime * 100) / 100}ms`);
    console.log(`  Average Success Rate: ${Math.round(avgSuccessRate * 100) / 100}%`);
    console.log(`  Total Throughput: ${Math.round(totalRPS * 100) / 100} req/s`);

    // Performance grade
    let grade = 'F';
    if (avgResponseTime < 50) grade = 'A+';
    else if (avgResponseTime < 100) grade = 'A';
    else if (avgResponseTime < 200) grade = 'B';
    else if (avgResponseTime < 500) grade = 'C';
    else if (avgResponseTime < 1000) grade = 'D';

    console.log(`\n  Performance Grade: ${grade}`);

    // Save to file
    this.saveReport();
  }

  saveReport() {
    const reportDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `benchmark-${timestamp}.json`);

    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        avgResponseTime: this.results.reduce((sum, r) => sum + r.avgTime, 0) / this.results.length,
        avgSuccessRate: this.results.reduce((sum, r) => sum + r.successRate, 0) / this.results.length,
        totalRPS: this.results.reduce((sum, r) => sum + r.requestsPerSecond, 0),
      },
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved to: ${reportPath}`);
  }

  async cleanup() {
    await this.app.close();
    console.log('\n✅ Benchmark completed successfully!\n');
  }
}

// Run benchmark
async function main() {
  const benchmark = new PerformanceBenchmark();
  
  try {
    await benchmark.initialize();
    await benchmark.runAllBenchmarks();
    benchmark.generateReport();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    await benchmark.cleanup();
  }
}

if (require.main === module) {
  main();
}

export { PerformanceBenchmark };
