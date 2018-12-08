pragma solidity ^0.4.8;

import "./PLCRVoting.sol";

/**
@dev This contract only adds the funtionality of delegate voting to the PLCRVoting contact.
*/
contract PLCRDelegateVoting is PLCRVoting{

    event _DelegatedVotingRightsGranted(uint numTokens, address indexed voter);

    mapping(address => mapping( address => uint)) public delegatedTokenBalance; // maps user address to another user address and balance

    /**
    @notice Loads _numTokens ERC20 tokens into the voting contract of sender and delegates voting rights to _to address
    @dev Assumes that msg.sender has approved voting contract to spend on their behalf
    @param _numTokens The number of votingTokens desired in exchange for ERC20 tokens
    @param _to The address of who will vote on sender's behalf
     */
    function requestDelegateVotingRightsTo(address _to, uint _numTokens) public{
        require(token.balanceOf(msg.sender) >= _numTokens,"Token Balance not sufficiant to delgate");
        delegatedTokenBalance[msg.sender][_to] += _numTokens;
        voteTokenBalance[msg.sender] += _numTokens;
        require(token.transferFrom(msg.sender, this, _numTokens));
        emit _DelegatedVotingRightsGranted(_numTokens, _to);
    }

    /**
    @notice Delegates already owned voting rights to _to address
    @dev Assumes that msg.sender has approved voting contract to spend on their behalf
    @param _to The address of who will vote on sender's behalf
    */
    function delegateVotingRightsTo(address _to, uint _numTokens) public{
        require(voteTokenBalance[msg.sender] >= _numTokens,"Not enough voting right to delegate");
        delegatedTokenBalance[msg.sender][_to] += _numTokens;
        emit _DelegatedVotingRightsGranted(_numTokens, _to);
    }

    /**
    @notice Commits vote using hash of choice and secret salt to conceal vote until reveal
    @param _pollID Integer identifier associated with target poll
    @param _secretHash Commit keccak256 hash of voter's choice and salt (tightly packed in this order)
    @param _numTokens The number of tokens to be committed towards the target poll
    @param _prevPollID The ID of the poll that the user has voted the maximum number of tokens in which is still less than or equal to numTokens
    */
    function commitVoteOnBehalf(address _from,uint _pollID, bytes32 _secretHash, uint _numTokens, uint _prevPollID) public {
        require(commitPeriodActive(_pollID));

        // msg.sender must be autherized to spend engough
        require(delegatedTokenBalance[_from][msg.sender]>=_numTokens);

        // make sure _from has enough voting rights
        require(voteTokenBalance[_from] >= _numTokens);

        // prevent user from committing to zero node placeholder
        require(_pollID != 0);

        // prevent user from committing a secretHash of 0
        require(_secretHash != 0);

        // removing  delegated amout from the msg.sender
        delegatedTokenBalance[_from][msg.sender] = delegatedTokenBalance[_from][msg.sender].sub(_numTokens);

        // Check if _prevPollID exists in the user's DLL or if _prevPollID is 0
        require(_prevPollID == 0 || dllMap[_from].contains(_prevPollID));

        uint nextPollID = dllMap[_from].getNext(_prevPollID);

        // edge case: in-place update
        if (nextPollID == _pollID) {
            nextPollID = dllMap[_from].getNext(_pollID);
        }

        require(validPosition(_prevPollID, nextPollID, _from, _numTokens));
        dllMap[_from].insert(_prevPollID, _pollID, nextPollID);

        bytes32 UUID = attrUUID(_from, _pollID);

        store.setAttribute(UUID, "numTokens", _numTokens);
        store.setAttribute(UUID, "commitHash", uint(_secretHash));

        pollMap[_pollID].didCommit[_from] = true;
        emit _VoteCommitted(_pollID, _numTokens, _from);
    }
}
