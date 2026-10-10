# Jobs and Workers

## Strategy
- **Queue strategy**: Valkey (Database: adintelix) for transient queue/coordination needs.
- **Job types**: Ad ingestion, AI batch analysis, web crawling.
- **Workers**: Run on Blitz Cloud using Docker.
- **Data Truth**: PostgreSQL remains the source of truth.

## Handling
- Retry strategy, Idempotency, Failure handling, Rate-limit handling, Dead-letter/failure strategy.
- Worker responsibilities: Heavy processing, large reports, long-running processing.
