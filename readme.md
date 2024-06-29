# Weather Monitoring System: 

## Setup and run

## 1.


## Technology Choices and Rationale

## 1. Programming Language and Framework

### Options Considered:
1. Node.js with TypeScript
2. Python with FastAPI

### Considerations:
- Performance for concurrent connections
- Ease of development and maintenance
- Ecosystem and library support
- Asynchronous programming capabilities
- JSON handling
- Developer availability and familiarity for FE developers

### Decision: Node.js with TypeScript

#### Pros:
- Excellent handling of concurrent connections via event-driven, non-blocking I/O
- Strong typing with TypeScript enhances code quality and maintainability
- Native JSON support for efficient API responses
- Large ecosystem with well-maintained libraries
- Efficient for I/O-bound operations
- Familiarity for FE web developers

#### Cons:
- Potential security concerns with npm packages
- Slightly steeper learning curve compared to Python overall (especially typescript)

#### Rationale:
Given the high-frequency data ingestion from numerous devices, NodeJS's superior handling of concurrent connections was the deciding factor. TypeScript adds type safety, improving maintainability and reducing runtime errors.

## 2. Database

### Options Considered:
1. PostgreSQL
2. InfluxDB

### Considerations:
- Write performance for time-series data
- Scalability
- Built-in time-series functionality
- Query performance for time-based aggregations
- Data retention policies

### Decision: InfluxDB

#### Pros:
- Optimized for time-series data and high write throughput
- Built-in functions for time-based aggregations
- Efficient data compression
- Flexible data retention policies
- Designed for horizontal scalability

#### Cons:
- Less familiar than traditional relational databases, less established and versatile than Postgres (feature extensability needs of this system are unknown)
- Limited support for complex joins and transactions

#### Rationale:
InfluxDB's specialization in time-series data aligns perfectly with our use case of frequent temperature readings. Its high write performance and built-in time-based aggregations are crucial for our system's requirements. This might be rethought with more information around future features that might need support.

## 3. API Design

### Decision: RESTful API using Express.js

#### Rationale:
Requirements doc calls for REST and Express.js is a popular, established, lightweight framework for building APIs in Node.js. It provides a simple, flexible way to define routes and middleware, making it easy to build and maintain a RESTful API.

## 4. Development and Deployment

### Decisions:
- Docker for containerization
- Docker Compose for multi-container management

#### Rationale:
Docker ensures consistency across development and production environments. Docker Compose simplifies the process of running multi-container applications, which is beneficial for our Node.js application and InfluxDB setup.

## Conclusion

The combination of Node.js with TypeScript and InfluxDB provides a robust, scalable solution for our weather monitoring system. This stack offers high performance for concurrent connections and time-series data handling, crucial for managing data from numerous devices sending frequent updates. The use of Docker ensures easy deployment and scalability.