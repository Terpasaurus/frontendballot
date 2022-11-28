import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {ethers} from 'ethers';
import { Mnemonic } from 'ethers/lib/utils';
import tokenJson from '../assets/myToken.json';
import ballotJson from '../assets/ballot.json';

const TOKENIZED_VOTES = "0xd75f993acc49D1Ca14b700046E826861FCa4e678";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  provider: ethers.providers.Provider;
  wallet: ethers.Wallet | undefined;
  tokenContract: ethers.Contract | undefined;
  ballotContract: ethers.Contract | undefined;
  etherBalance: number | undefined;
  tokenBalance: number | undefined;
  votePower: number | undefined;
  ballotVotePower: number | undefined;
  ballotVotePowerSpent: number | undefined;
  tokenAddress: string | undefined;
  nmemonic: string | undefined;
  title: any;
  winningProposal: string | undefined;

  constructor(private http: HttpClient) {
      this.provider = ethers.providers.getDefaultProvider('goerli');
  }
createWallet(){
    this.http.get<any>("http://localhost:3000/token-address").subscribe((ans) => {
        this.tokenAddress = ans.result;
    if (this.tokenAddress) {
      this.wallet = ethers.Wallet.createRandom().connect(this.provider);
      this.tokenContract = new ethers.Contract(this.tokenAddress, tokenJson.abi, this.wallet);
      // Ether Balance
      this.updateInfo(this.wallet, this.tokenContract );
   }
  });
  }
  importWallet(mnemonic: string) {
    this.http.get<any>("http://localhost:3000/token-address").subscribe((ans) => {
        this.tokenAddress = ans.result;
    if (this.tokenAddress) {
      //this.wallet = ethers.Wallet.createRandom().connect(this.provider);
      this.wallet = ethers.Wallet.fromMnemonic(mnemonic ?? "").connect(this.provider);
      this.tokenContract = new ethers.Contract(this.tokenAddress, tokenJson.abi, this.wallet);
      // Ether Balance
      this.updateInfo(this.wallet, this.tokenContract );
   }
  });
  }
  claimTokens(numberTokens: string){
    this.http
      .post<any>("http://localhost:3000/claim-tokens", {address: this.wallet?.address,numberTokens: numberTokens})
      .subscribe((ans) => {
        console.log(ans.result);
        const txHash = ans.result;
        this.provider.getTransaction(txHash).then((tx) => {
          tx.wait().then((receipt) => {
            //TODO: (optional) display
            // relod info by calling update info
            // Ether Balance
            this.updateInfo(this.wallet, this.tokenContract);
          })
        })
            
    });
  }
  //connect to tokenized ballot and read info
  connectBallot(address: string){
    this.ballotContract = new ethers.Contract(address, ballotJson.abi, this.wallet);   
    this.updateVoteInfo(this.wallet, this.ballotContract);
    console.log(address);
  }

  //Delegate Votes using ERC20Votes Token
  delegateVotes(address: string){
    this.tokenContract?.["delegate"](address).then(
      () => {
      console.log("TESTING");
      });
  }
  //Delegate Votes using Tokenized Ballot
  vote(selection: string, votes: string){
    this.ballotContract?.["vote"](selection, votes).then(
      () => {
      });
  }
  //Results of Tokenized Ballot
  queryResult(){
    this.ballotContract?.["winnerName"]().then(
      (winnerName: string) => {
        this.winningProposal = ethers.utils.parseBytes32String(winnerName);
      });
  }
  private updateVoteInfo(wallet: any, ballotContract: any) {
    console.log(ballotContract);
    ballotContract["votePower"](wallet.address).then(
    (votesBallot: ethers.BigNumberish) => {
      this.ballotVotePower = parseFloat(ethers.utils.formatEther(votesBallot)); 
    });
    ballotContract["votePowerSpent"](wallet.address).then(
    (votesSpent: any) => {
      this.ballotVotePowerSpent = votesSpent; 
    });
  }
  private updateInfo(wallet: any, tokenContract: any) {
    wallet.getBalance().then((balanceBN: ethers.BigNumberish) => {
      this.etherBalance = parseFloat(ethers.utils.formatEther(balanceBN));
    });
    // Token Balance
    tokenContract["balanceOf"](wallet.address).then(
      (tokenBN: ethers.BigNumberish) => {
        this.tokenBalance = parseFloat(ethers.utils.formatEther(tokenBN));
      });
    // Vote Power
    tokenContract["getVotes"](wallet.address).then(
      (votesBN: ethers.BigNumberish) => {
        this.votePower = parseFloat(ethers.utils.formatEther(votesBN));
      }); 
  }
}
