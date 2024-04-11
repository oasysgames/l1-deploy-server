# l1-deploy-server
This server offers a API and UI to facilitate the deployment of smart contracts through the Oasys Factory contract. Tailored for developers and users within the Oasys ecosystem, it provides a simplified process for deploying contracts, ensuring a user-friendly experience.

## Getting Started
Install dependencies.
```sh
yarn install
```
Set up environment variables.
```sh
cp .env.sample .env
```
Running the Server
```sh
yarn start
```

## API Endpoints
- GET /health: Returns a greeting message and instructs to use the /deploy endpoint.
- POST /deploy: Accepts an array of contract deployment requests. Returns addresses of deployed contracts or an error message.
