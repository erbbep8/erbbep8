
## Installation Guide

### Prerequisites

Before installing this project, make sure you have the following prerequisites:

1. Node.js (version 14 or higher)
2. MongoDB (version 4.4 or higher)
3. install git for window/mac/linux

### Installation Steps

1. Clone the repository:

```bash
git clone https://github.com/erbbep8/erbbep8.git
```

2. Navigate to the project directory:

```bash
cd final-proj
```

3. Install the dependencies:

```bash
npm install
```

4. Set up the environment variables:

Create a `.env` file in the root directory of the project and add the following content:

```env
dbConnectString=mongodb://localhost:27017
```

Replace `mongodb://localhost:27017` with your MongoDB connection string.

5. Set up the MongoDB database and start the MongoDB server:

```bash
mongod --dbpath data/db
```

6. Start the server:

```bash
npm start
```

7. Access the application in your web browser:

```bash
http://localhost:8888
```

### Configuration

The project uses the `config.js` file for configuration. You can customize the configuration by modifying the values in the `config` object.

### Notes

- The `data/db` directory is used to store the MongoDB data. Make sure to create it before starting the MongoDB server.

That's it! You should now have a working installation of the project.