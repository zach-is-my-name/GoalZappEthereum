[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />
<br />

<p align="center">
  <a href="https://github.com/zach-is-my-name/GoalZappEthereum">
    <img src="https://i.ibb.co/wKhgq52/Goal-Zapp-Logo.png" alt="Logo" width="277" height="91">
  </a>
  </p>

<div align="center"> 
<h3><a href="http://www.getgoalzapp.com">http://www.getgoalzapp.com</a></h3> 
</div>




<div align="center">
    <p>
        <em><b>"Given enough eyeballs, all bugs are shallow"</b></em>
    </p>
<div align="center">
    <p>
        <em>~ Linus Tovalds, creator of Linux, the world's largest open source software project</em>
    </p>
    </div>	
</div>



<br />

* GoalZapp is an Ethereum enabled web application allowing you to post personal goals and receive suggested steps from others toward achieving those goals.
  <br />

* Suggesters are rewarded with the ZAPP token for their contribution if you deem their suggested step valuable enough to be included in your list of steps
  <br />

* Like a crowd sourced, token incentivized, recipe for success for achieving your dreams...
  </p>

</p>
<br />
<br />

<!-- TABLE OF CONTENTS -->
 <h2 style="display: inline-block">Table of Contents</h2>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
       <li><a href="#key-features">Key Features</a></li>
       <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#getting started">Getting Started</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li> <a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
<br />
<br />

<!-- ABOUT THE PROJECT -->

## About The Project

<!-- ABOUT THE PROJECT -->
<a href="https://ibb.co/G37mzGc"><img src="https://i.ibb.co/sJj78cy/Goal-Zapp-Screen-Shot.png" alt="Goal-Zapp-Screen-Shot" border="0"></a>

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***GoalZapp*** was designed with the intent to help people.  Unlike other places on the internet where people turn for advice (ie. Reddit, Quora, StackExchange), ***GoalZapp*** features a crypto-financial mechanism to simultaneously incentivize *quality contributions*, and to disinsentivize both low-quality advice and financial speculators who errode intrinsic value of utility tokens.   

### Key Features

##### 	**Automated Market Maker with Bonding Curve** 

* The buy / sell price is a function of the amount of tokens in circulation (a.k.a. total tokens owned)

* Buying a token:

  * Money (ETH) is sent to the Bonding Curve Contract
    * ETH remains in contract as collatoral
  * Token is created (minted) 
  * Sent to buyer
  * Added to the circulation

* More tokens in circulation = higher token price

  * (*Interestingly Side-Note:* price is calculated dynamically. e.g.  A single transaction to purchase 10 tokens costs a higher $ amount / per token, than a single transaction to purchase 5 tokens, because the purchase its self is augmenting supply and affecting the price paid) 

* Selling a token: 

  * Token(s) are sent to the Bonding Curve Contract
    * ETH from collateral pool is paid to the seller
  * Token is destroyed (burned)
  * Removed from circulation

* Fewer tokens in circulation = lower token price

  

  ​    [View the graph in interactive mode](https://www.desmos.com/calculator/w3f9wqu7jg) to trace the price of the token at a given supply
  
  
  
  <a href="https://ibb.co/gZX23S3"><img src="https://i.ibb.co/KxQPX2X/Bonding-Curve-Graph.png" alt="Bonding-Curve-Graph" border="0"></a>



*Parameters*:
<img src="https://i.ibb.co/FzZVjX3/Bonding-Curve-Formula.png" alt="Bonding-Curve-Formula" border="0">



* Initial Token Supply (s) = 128
* Balance of Contract (b) = .03359789 ETH
* Reserve Ratio (r) = .333333 
  * For standard point-slope reference  `m = b / (r * s ^ (1 / r))`



&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***Motivation***: *simple, intuitive, fair pricing with a strong mechanism for driving platform growth*

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Note:* Parameterizing a bonding curve is very much an act of balancing priorities.  Adjusting for how quickly price rises relative to the total amount of tokens purchased by users of the system hinges on two competing priorities: **financial incentive** and **accessibility**.  A curve that rises more gradually and evenly favors accessibility and platform utility (more tokens can be bought at a relatively lower price; lowering barrier to entry).  A curve that rises more quickly favors financial incentive (it's profitable to "buy now", because the price will escalate quickly).  The chosen parameters as implemented lean towards financial incentive because profit-motive is the strongest driver of network participation.  Combined with the measures outlined below to limit pure speculative behavior, we hope to achieve the highest level of participation.   

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;*Thought experiment:* How does the incentive to profit from contributions compare to the purely intrinsic nature of contributions on platforms such Stack Exchange and Reddit? Are these motives mutually exclusive? 

<br />

__Trading Restrictions__ 

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;You can't sell or transfer the token until you use it first

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***Motivation***: *The people who buy tokens on GoalZapp actually use GoalZapp* 

<br />

__Protection Period__

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Even after using the token for its intended utility (paying people for helpful suggestions on your goal),  you still must wait to a period of 3 days to transfer it.  

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;***Motivation***: This serves once again to protect the beneficiaries of the platform and add friction to financial speculators.  Honest users are given further assurance that they will not fall victum to pump and dump schemes, strengthing the *utility orientation* of the token.   

<br />

### Built With

* [Ethereum](http://ethereum.org)
* [ReactJs](http://reactjs.org)
* [GraphQL](http://graphql.org)
* [web3.js](https://github.com/ChainSafe/web3.js)
* [Truffle](http://trufflesuite.com)
* [8Base](http://app.8base.com)



<!-- Usage -->

## Usage

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Here's how you can build a roadmap of steps toward achieving your posted goal; Or contribute your knowledge towards building the steps list of someone else's go:

#### Own goal

* Create a goal
* Add steps to your goal
* Reorder steps
* Remove Steps

#### Someone else's Goal

* Suggest a step on a goal
* Suggest remove a step 
* Suggest Edit a a step

#### Own goal with suggestions

* Accept a suggested step
* Decline a suggested step

<!--Rewards and Risks -->



### Application Flow: Rewards and Risks*

##### 	***\*All funds associated with risks and rewards are denominated in GoalZapp tokens***



#### Own Goal

* When you create a goal, you have the option to fund an escrow smart contract associated with that goal (you may fund the goal any time after creation)
* Attaching funds to your goal enables you to accept suggestions from other users
* Funds are used to pay:
  * The reward amount to suggesters (set globally by administrator)
  * The bond amount
    * Bonds are utilized to incentivize engagment and prevent stale suggestions
      * Bonds are only transfered between the goal escrow contract and the user who posted it
        * Because bonds posted are effectively locked in a contract until a user takes action, they incentivize a user to return to any action they initiated
        * Bonds are released even if a user fails to take action, by utilizing a timer mechanism (currently 3 days) 
  * ***When you accept a step***:
    * The reward amount is automatically sent to a suggester
    * The bond amount is returned to both parties (suggester and goal owner)
  * ***When you reject a step:***
    * The reward amount remains in the smart contract
    * The bond amount is returned to both parties (suggester and goal owner)



#### Someone Else's Goal

* To view goals created by other users, go to the *Globalfeed page* 
  * Click the goal of the user you're interested in
* On another user's goal page, you see that user's goal and corresponding steps
* You can:
  * Suggest a step
  * Suggest edit a step
  * Suggest remove a step
  * Suggest move a step
* At this time: **only *suggest step* has an economic consequence**
  * When you suggest a step, you choose an amount to post as a bond
    * (arbitrary bond amounts chosen by the suggester; > 1 token ) 
  * your Ethereum wallet will prompt you to accept a series of transactions
    * These transactions include:
      * Approval to move tokens from your wallet 
      * Subsequent transfer of tokens as bond to escrow contract



### Risks and Rewards Summary

* *Suggestions goal owner accepts pay out 1 token to the suggester* 



<!-- GETTING STARTED -->

## Getting Started

* Install a web3 provider | for example: [MetaMask](http://metamask.io)

* Connect to the Ropsten testnet && [have testnet Ether](https://facuet.ropsten.be)
* Head to http://www.getgoalzapp.com
* Create and account and login



<!-- ROADMAP -->

## Roadmap

* Integrate smart contracts to L2 roll-up [Optimism](http://optimism.io) 



<!-- TESTING -->

## Testing

* Install [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/)

* Switch to branch [dockerTestVersion](https://github.com/zach-is-my-name/GoalZappEthereum/tree/dockerTestVersion)
* `cd GoalZapp` 
* `docker-compose up`

<!-- CONTRIBUTING -->

## Contributing

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License

<!-- CONTACT -->

## Contact

Twitter: [@_zach_michaels](https://twitter.com/_zach_michaels) - 

Email: contact@zachmichaels.dev

Project Link: [https://github.com/zach-is-my-name/GoalZappEthereum](https://github.com/zach-is-my-name/GoalZappEthereum)



## Acknowledgments

* [Simon de la Rouviere](https://twitter.com/@simondlr)
  * For eloquently elaborating on the nature of tokens in 2015 [youtube](https://youtu.be/kE5oGw8oKsY)
  * For his work on developing bonding curves [medium](https://medium.com/@simondlr/bancors-smart-tokens-vs-token-bonding-curves-a4f0cdfd3388)
* [Bancor](https://twitter.com/Bancor)
  * For creating and contributing the essential formula that make bonding curves possible in Solidity [github](https://github.com/bancorprotocol/contracts-solidity/blob/master/solidity/contracts/converter/BancorFormula.sol)
* [Slava Balasanov](https://twitter.com/team_slava)
  * For laying out in technical terms how bonding curves work [medium](https://blog.relevant.community/bonding-curves-in-depth-intuition-parametrization-d3905a681e0a)
  * and personally answering questions 
* [Billy Rennekamp](https://twitter.com/billyrennekamp)
  * For conveying bonding curve technical terms and formulas in a simplified way [medium](https://billyrennekamp.medium.com/converting-between-bancor-and-bonding-curve-price-formulas-9c11309062f5)
* [Karl Floersch](https://twitter.com/karl_dot_tech)
  * For keeping the flame of altruism through applied technology

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/zach-is-my-name/GoalZappEthereum.svg?style=for-the-badge
[contributors-url]: https://github.com/zach-is-my-name/GoalZappEthereum/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/zach-is-my-name/GoalZappEthereum.svg?style=for-the-badge
[forks-url]: https://github.com/zach-is-my-name/GoalZappEthereum/network/members
[stars-shield]: https://img.shields.io/github/stars/zach-is-my-name/GoalZappEthereum.svg?style=for-the-badge
[stars-url]: https://github.com/zach-is-my-name/GoalZappEthereum/stargazers
[issues-shield]: https://img.shields.io/github/issues/zach-is-my-name/GoalZappEthereum.svg?style=for-the-badge
[issues-url]: https://github.com/zach-is-my-name/GoalZappEthereum/issues
[license-shield]: https://img.shields.io/github/license/zach-is-my-name/GoalZappEthereum.svg?style=for-the-badge
[license-url]: https://github.com/zach-is-my-name/GoalZappEthereum/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/zach-is-my-name
