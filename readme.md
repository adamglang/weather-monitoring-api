# Weather Monitoring System

## Overview

This project implements a RESTful API service for a weather monitoring system, designed to handle data from numerous devices efficiently. It meets the requirements of device enrollment, temperature data ingestion, and aggregated temperature data retrieval.

## Key Features

1. Device enrollment with UUID generation
2. Secure temperature data submission for enrolled devices
3. Daily temperature statistics retrieval (high, low, average)
4. Scalable architecture using Node.js, TypeScript, and PostgreSQL with TimescaleDB
5. Efficient data ingestion using Apache Kafka

## Setup and Run

1. Ensure Docker is installed on your machine.
2. Clone the repository and navigate to the project root.
3. Run: `docker-compose up -d --build`
4. The API will be accessible at `http://localhost:3000`

## API Usage

1. Authenticate:
    ```
    POST http://localhost:3000/auth/login
    Body: { "username": "admin", "password": "admin" }
    ```
    Use the returned token as a Bearer Token for all subsequent requests.

2. Enroll a device:
    ```
    POST http://localhost:3000/api/devices
    Body: {
      "serial": "unique_serial_number",
      "latitude": 47.6061,
      "longitude": -122.3328
    }
    ```

3. Submit a temperature reading:
    ```
    POST http://localhost:3000/api/temperature-readings
    Body: {
      "deviceId": "device_uuid_from_enrollment",
      "temperature": 45.44
    }
    ```

4. Retrieve daily statistics:
    ```
    GET http://localhost:3000/daily-stats/{deviceId}
    ```
    Optionally add `?date=DD-MM-YYYY` for a specific date.

## Testing

Run the test suite with: `yarn test`

## Technical Choices and Rationale

### Node.js with TypeScript

Chosen for its excellent handling of concurrent connections, strong typing, and extensive ecosystem. This aligns with the need to handle frequent data ingestion from numerous devices.

### PostgreSQL with TimescaleDB

Offers a balance between time-series optimization and relational database flexibility. It provides efficient storage and querying of time-series data while maintaining ACID compliance and transaction support.

### Apache Kafka

Implements a robust event ingestion queue capable of handling high-frequency data submissions from multiple devices.

### RESTful API (Express.js)

Fulfills the requirement for a REST API, providing clear endpoints for device enrollment, data submission, and statistics retrieval.

### Docker

Ensures consistency across development and production environments, simplifying deployment and scaling.

These choices were made to create a scalable, maintainable system capable of handling the high volume of data from weather monitoring devices while providing flexibility for future enhancements.

## Conclusion

This implementation meets all the specified requirements, including device enrollment, secure data submission, and aggregated data retrieval. The architecture is designed to be scalable and efficient, capable of handling data from a large number of devices. We welcome any questions or feedback on the implementation.