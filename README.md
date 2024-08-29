# Payrock
Cross-chain payment gateways are difficult to implement. You have to deal with storing keys and addresses of wallets on various networks. Luckily, payrock.me has arrived to put an end to this problem.

## What is Payrock?
Payrock is a peer-to-peer, anonymous, and secure cryptocurrency payment gateway. You can seamlessly integrate Payrock into your project and start using it without paying fees to 3rd parties.

Payrock has its power from zrSign technology and all of the infrastructure is built on top of its smart contracts.

## How it works?
![Payrock Flowchart](https://github.com/user-attachments/assets/260476dd-e905-4812-ae6e-91bc29d87dec)

Payrock has a simple working mechanism. Developers that are willing to implement Payrock should only deal with payment status, and decide what to do after the payment. Other than that, every single step is done by Payrock with its robust infrastructure built on zkSign.

## How to implement?
Payrock integration has 3 steps:

- Setting up the necessary information on the dashboard
- Sending API requests
- Handling responses
Each step is explained at [Payrock Docs](https://docs.payrock.me/). Please take a look at Payrock documentation to learn how to integrate it.

## Working algorithm
Let's dive deep into the Payrock mechanism and understand how everything works.

Everything starts with an API call to /create-payment endpoint. An available zrSign wallet is received and set as the deposit address. The customer has to pay to this address with a desired network, within 1 hour.

Every 30 seconds, Payrock checks all of the pending transactions and updates their status.

After a successful (or partly-paid) transaction, the balance in zrSign wallets is transferred to the owner's wallet. The owner in our case is the creator of the payment link. In other words, the developer is the owner.

After the user pays, they get redirected to the redirection URL set by the owner.

## Tech Stack
### For frontend:
- React
- Zustand
- react-router-dom
- Sass

### For backend:
- Express.js
- MongoDB
- ethers.js + zrSign Contracts

## What's next?
The upcoming update is going to be a Webhook implementation. In that way, other servers can directly communicate with Payrock's.

Payrock is the first-ever payment gateway on zrSign and it's going to bring a lot to the Zenrock ecosystem, join us at payrock.me

Website: payrock.me

Docs: docs.payrock.me
