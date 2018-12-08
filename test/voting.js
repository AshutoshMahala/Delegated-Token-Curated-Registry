/* eslint-env mocha */
/* global assert contract */
const utils = require('./utils.js');

const fs = require('fs');
const BN = require('bignumber.js');

const config = JSON.parse(fs.readFileSync('./conf/config.json'));
const paramConfig = config.paramDefaults;

contract('PLCRVoting', (accounts) => {
  describe('Function: commitVote', () => {
    const [applicant, challenger, voter1,voter2] = accounts;

    let token;
    let voting;
    let parameterizer;
    let registry;

    beforeEach(async () => {
      const {
        votingProxy, paramProxy, registryProxy, tokenInstance,
      } = await utils.getProxies();
      voting = votingProxy;
      parameterizer = paramProxy;
      registry = registryProxy;
      token = tokenInstance;


      await utils.approveProxies(accounts, token, voting, parameterizer, registry);
    });

    it('should correctly update DLL state', async () => {
      const firstDomain = 'first.net';
      const secondDomain = 'second.net';
      const minDeposit = new BN(paramConfig.minDeposit, 10);

      await utils.as(applicant, registry.apply, firstDomain, minDeposit, '');
      await utils.as(applicant, registry.apply, secondDomain, minDeposit, '');
      const firstPollID = await utils.challengeAndGetPollID(firstDomain, challenger, registry);
      const secondPollID = await utils.challengeAndGetPollID(secondDomain, challenger, registry);
      await utils.commitVote(firstPollID, 1, 7, 420, voter1, voting);
      await utils.commitVote(secondPollID, 1, 8, 420, voter1, voting);
      await utils.commitVote(firstPollID, 1, 9, 420, voter1, voting);
      const insertPoint = await voting.getInsertPointForNumTokens.call(voter1, 6, firstPollID);
      const expectedInsertPoint = 0;

      assert.strictEqual(
        insertPoint.toString(10), expectedInsertPoint.toString(10),
        'The insert point was not correct',
      );
    });

    it('request delegate should correctly update DLL state', async () => {
      const firstDomain = 'first.net';
      const secondDomain = 'second.net';
      const minDeposit = new BN(paramConfig.minDeposit, 10);

      await utils.as(applicant, registry.apply, firstDomain, minDeposit, '');
      await utils.as(applicant, registry.apply, secondDomain, minDeposit, '');
      const firstPollID = await utils.challengeAndGetPollID(firstDomain, challenger, registry);
      const secondPollID = await utils.challengeAndGetPollID(secondDomain, challenger, registry);
      
      await utils.commitVoteOnBehalf(voter1,firstPollID, 1, 12, 420, voter2, voting);

      const insertPoint = await voting.getInsertPointForNumTokens.call(voter1, 13, secondPollID);
      const expectedInsertPoint = 1;

      assert.strictEqual(
        insertPoint.toString(10), expectedInsertPoint.toString(10),
        'The insert point was not correct',
      );
    });

    it('delegate should correctly update DLL state', async () => {
      const firstDomain = 'first.net';
      const secondDomain = 'second.net';
      const minDeposit = new BN(paramConfig.minDeposit, 10);

      await utils.as(applicant, registry.apply, firstDomain, minDeposit, '');
      await utils.as(applicant, registry.apply, secondDomain, minDeposit, '');
      const firstPollID = await utils.challengeAndGetPollID(firstDomain, challenger, registry);
      const secondPollID = await utils.challengeAndGetPollID(secondDomain, challenger, registry);

      const hash = utils.getVoteSaltHash(1, 420);
      await utils.as(voter1, voting.requestVotingRights, 8);
      await utils.as(voter1, voting.delegateVotingRightsTo, voter2, 7);

      const prevPollID = await voting.getInsertPointForNumTokens.call(voter1, 7, firstPollID);

      await utils.as(voter2, voting.commitVoteOnBehalf, voter1, firstPollID, hash, 7, prevPollID);
      
      const insertPoint = await voting.getInsertPointForNumTokens.call(voter1, 13, secondPollID);
      const expectedInsertPoint = 1;
      
      assert.strictEqual(
        insertPoint.toString(10), expectedInsertPoint.toString(10),
        'The insert point was not correct',
      );
    });
  });
});
