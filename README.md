# Delegated-Token-Curated-Registry
Token Curated Registry where delegate functionality has been added for commiting a vote. Where an owner of the tokens can provide right to someone vote on his behalf.

## Background
### ERC20
https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
### Proxy
https://blog.zeppelinos.org/proxy-patterns/
### PLCR
https://github.com/ConsenSys/PLCRVoting
### TCR
https://github.com/skmgoldin/tcr

## Environment Dependencies
- Node 8
- python2.7
- Truffle 4.1.12
- Ganache-cli v6.1.8

For other dependecies, run the below command:
```
npm install
```

## Testing
In first terminal, run the below command:
```
ganache-cli
```
Open other terminal and run:
```
truffle test ./test/voting.js
```
