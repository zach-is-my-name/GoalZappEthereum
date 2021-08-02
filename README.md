[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]



<!-- PROJECT LOGO -->
<br />

<p align="center">
  <a href="https://github.com/zach-is-my-name/GoalZappEthereum">
    <img src="https://i.ibb.co/wKhgq52/Goal-Zapp-Logo.png" alt="Logo" width="277" height="91">
  </a>
  </p>



<div align="center"> 
<h3><a href="http://www.getgoalzapp.com">http://www.getgoalzapp.com</a></h3> 
</div>

<br />
 GoalZapp is an Ethereum enabled web application allowing you to post personal goals and receive suggested steps from others toward achieving those goals.
<br />
<br />
Suggesters are rewarded with the ZAPP token for their contribution if you deem their suggested step valuable enough to be included in list of steps you're able to generate on your own.

Kinda like a crowd sourced, token incentivized, recipe for success for
achieving your dreams...
</p>

</p>




<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#testing">Testing</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->

## About The Project

<!-- ABOUT THE PROJECT --[![Product Name Screen Shot][product-screenshot]](https://example.com) -->

***GoalZapp*** was designed with the intent to help people.  Unlike other places on the internet where people turn to for advice (ie. Reddit, Quora, StackExchange), ***GoalZapp*** features a crypto-financial mechanism to simultaneously incentivize *quality contributions*, and to disinsentivize both low-quality advice and financial speculators who errode value of utility tokens.   

### Key Features

##### 	Automated Market Maker with Bonding Curve

​	The buy / sell price is a function of amount tokens in circulation

​		More tokens held by users = higher token price

​		<!-- Insert graphic showing the curve and parameters -->	

​    ***Motivation***: *simple, intuitive, fair pricing with a strong mechanism for driving platform growth*



##### Trading Restrictions 

​	You can't sell or transfer the token until you use it first

​	***Motivation***: *The people who buy tokens on GoalZapp actually use GoalZapp* 



##### Protection Period 

​	Even after using the token for its intended utility (paying people for helpful suggestions on your goal),  you still must wait to a period of 3 days to transfer it.  

***Motivation***: This serves once again to protect the beneficiaries of the platform and add friction to financial speculators.  Honest users are given further assurance that they will not fall victum to pump and dump schemes, strengthing the *utility orientation* of the token.   





### Built With

* [Ethereum](http://ethereum.org)
* [ReactJs](http://reactjs.org)
* [GraphQL](http://graphql.org)
* [web3.js](https://github.com/ChainSafe/web3.js)
* [Truffle](http://trufflesuite.com)
* [8Base](http://app.8base.com)



<!-- USAGE EXAMPLES -->

## What you can do

Here's how you can build a roadmap of steps toward acheiving your posted goal; 

Or contribute your knowledge towards building the steps list of someone else's go:

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

## Rewards and Risks*

##### ***\*All funds associated with risks and rewards are denominated in GoalZapp tokens***



#### Own Goal

* When you create a goal, you have the option to fund an escrow smart contract associated with that goal (you may fund the goal any time after creation)
* Attaching funds to your goal enables you to accept suggestions from other users
* Funds are used to pay:
  * The reward amount to suggesters (set globally by adminstrator)
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

















<!-- GETTING STARTED -->







## Getting Started

* Install a web3 provider | for example: [MetaMask](http://metamask.io)

* Connect to the Ropsten testnet && [have testnet Ether](https://facuet.ropsten.be)
* Head to http://www.getgoalzapp.com
* Create and account and login

### Example Flow











<!-- ROADMAP -->

## Roadmap

* Deploy smart contracts to L2 roll-up [Optimism](http://optimism.io) 



<!-- TESTING -->

## Testing

* Install [Docker](https://www.docker.com/products/docker-desktop) and [Docker Compose](https://docs.docker.com/compose/install/)

* Switch to branch [dockerTestVersion](https://github.com/zach-is-my-name/GoalZappEthereum/tree/dockerTestVersion)
* `cd GoalZapp` 
* `docker-compose up`

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Your Name - [@_zach_michaels](https://twitter.com/_zach_michaels) - contact@zachmichaels.dev

Project Link: [https://github.com/zach-is-my-name/GoalZappEthereum](https://github.com/zach-is-my-name/GoalZappEthereum)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements

* []()
* []()
* []()





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