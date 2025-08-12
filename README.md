## Installation

```bash
$ npm install
```

## Convert a Standalone mongod to a Replica Set

```bash
# run mongo container
$ docker compose up -d

# use mongosh to connect to the server instance
$ mongosh

# initialize the replica set
$ rs.initiate()
```

---

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

---

## License

Nest is [MIT licensed](LICENSE).
