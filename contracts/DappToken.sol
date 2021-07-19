pragma solidity >=0.4.22 <0.9.0;

contract DappToken {
  // Constructor
  // Set amount of tokens
  // Read amount of tokens
  string public name = 'DApp Token';
  string public symbol = 'DAPP';
  string public standard = 'DApp Token v1.0';
  uint256 public totalSupply;


  mapping(address => uint256) public balanceOf;

  constructor(uint256 _initialSupply) public {
    balanceOf[msg.sender] = _initialSupply;
    totalSupply = _initialSupply;
  }
}
