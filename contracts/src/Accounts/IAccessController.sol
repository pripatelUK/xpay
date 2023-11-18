// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAccessController {
    event OwnerAdded(address newOwner);
    event OwnerRemoved(address removedOwner);
    event GuardianAdded(address newGuardian);
    event GuardianRemoved(address removedGuardian);
    event ProposalSubmitted(uint256 proposalId, bytes newSignerProposed, address proposer);
    event QuorumNotReached(uint256 proposalId, bytes newSignerProposed, uint256 approvalCount);
    event ProposalDiscarded(uint256 proposalId, address discardedBy);
    event ProposalTimelockChanged(uint256 newTimelock);

    function isOwner(address _address) external view returns (bool);

    function addOwner(address _newOwner) external;
}
