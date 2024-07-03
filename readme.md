# Weather Monitoring System: 

## Setup and run

- Make sure docker is installed on your machine, then from the root directory run the following command to start the containers: `docker-compose up -d --build` once all the images build and start the endpoints should be accessable on `http://localhost:3000`
- Make a POST request to http://localhost:3000/auth/login with the following payload to get a token (I used postman for this):
```json
{
    "username": "admin",
    "password": "admin"
}
```

This should send back your authentication token which you'll add to the authentication header as a Bearer Token for all subsequent requests.

- You can add a device by making a POST request to `http://localhost:3000/api/devices` with the following payload:
```json
{
    "serial": "098765", // Must be unique
    "latitude": 47.6061, // latitude and longitude will change the timezone of the device which affects daily statistics
    "longitude": -122.3328
}
```

- To create a temperature reading for a device make a POST request to `http://localhost:3000/api/temperature-readings` with the following payload:
```json
{
    "deviceId": {deviceId}, // The id of the device you created
    "temperature": 45.44 // Any floating point number
}
```
Adding more of these will update the daily stats average, and possibly the daily low or high for that device for that day ("day" is midnight to the last second of the day in the device's timezone)

- After adding some temperature readings to one or more device, you can get the current day's stats for a device by making a GET request to `http://localhost:3000/daily-stats/{deviceId}` or request a specific day via `http://localhost:3000/daily-stats/{deviceId}?date=01-01-2024` where the date is in the format `DD-MM-YYYY`


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
Given the high-frequency data ingestion from numerous devices, NodeJS's superior handling of concurrent connections was the deciding factor particularly when considering the traffic involved in data ingestion given the number of monitoring devices (approaching a million polled every 5 seconds). TypeScript adds type safety, improving maintainability and reducing runtime errors.

## 2. Database

### Options Considered:
1. PostgreSQL with TimescaleDB extension
2. InfluxDB

### Considerations:
- Write performance for time-series data
- Scalability
- Built-in time-series functionality
- Query performance for time-based aggregations
- Data retention policies
- Flexibility for future feature additions
- Familiarity and ecosystem support

### Decision: PostgreSQL with TimescaleDB

#### Pros:
- Combines the power of a traditional RDBMS with optimizations for time-series data
- Strong ACID compliance and transaction support (no data loss was a requirement during design discussions with team)
- Rich querying capabilities with full SQL support
- TimescaleDB can provide efficient time-based functions and automatic partitioning
- Widely adopted with a large ecosystem and community support
- Flexibility to handle both time-series and relational data
- Scalable from single-node to multi-node clusters
- Supports continuous aggregates for efficient real-time analytics
- Compatible with PostGIS for geospatial data handling

#### Cons:
- May require more configuration and tuning compared to purpose-built time-series databases
- Raw write performance at extreme scales might be lower than specialized time-series databases

#### Rationale:
While InfluxDB offers excellent performance for time-series data, PostgreSQL with TimescaleDB provides a more versatile solution that balances performance with flexibility. The decision to use PostgreSQL with TimescaleDB is based on several factors:

1. Time-series Optimization: TimescaleDB provides the necessary optimizations for efficient storage and querying of time-series data, including automatic partitioning and efficient time-based aggregations.

2. Flexibility: As the full feature set and future requirements of the system are not yet known, PostgreSQL's ability to handle various data models and complex queries provides valuable flexibility for future expansion.

3. Familiarity and Ecosystem: PostgreSQL's widespread adoption means it's easier to find developers familiar with it, and it has a rich ecosystem of tools and extensions.

4. SQL Support: Full SQL support allows for complex queries and joins, which may be beneficial as the system evolves.

5. Scalability: TimescaleDB can scale from a single node to a distributed multi-node setup, accommodating growth in data volume and query complexity.

6. Data Retention and Aggregation: TimescaleDB offers features like continuous aggregates and data retention policies, crucial for managing long-term data storage and real-time analytics.

While InfluxDB might offer superior write performance at extreme scales, the combination of PostgreSQL and TimescaleDB is expected to meet our performance requirements while providing greater flexibility for future development. The trade-off of slightly lower raw write performance is balanced by the benefits of a more versatile and familiar database system.
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