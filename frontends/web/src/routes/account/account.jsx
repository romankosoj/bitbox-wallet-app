import { Component } from 'preact';
import List from 'preact-material-components/List';
import { apiGet } from '../../utils/request';
import { apiWebsocket } from '../../utils/websocket';
import Balance from '../../components/balance/balance';
import Send from './send/send';
import Receive from './receive/receive';
import Transactions from '../../components/transactions/transactions';
import componentStyle from '../../components/style.css';
import style from './account.css';

export default class Account extends Component {
  state = {
    walletInitialized: false,
    transactions: [],
    walletConnected: false,
    balance: {
      available: '',
      incoming: '',
      hasIncoming: false,
    },
    isReceive: false,
    isSend: false,
  }

  componentWillMount() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentDidMount() {
    this.onStatusChanged();
    this.unsubscribe = apiWebsocket(this.onWalletEvent);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    this.unsubscribe();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.code !== prevProps.code) {
      console.log("componentDidUpdate(" + this.props.code + ")");
      this.onStatusChanged();
    }
  }

  handleKeyDown = e => {
    if (e.keyCode === 27) {
      this.setState({
        isReceive: false,
        isSend: false,
      });
    } else {
      return;
    }
  }

  onWalletEvent = data => {
    if (data.type !== 'wallet') return;
    switch (data.data) {
    case 'statusChanged':
      this.onStatusChanged();
      break;
    case 'syncdone':
      this.onWalletChanged();
      break;
    }
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.code !== prevProps.code) {
      console.log("componentDidUpdate(" + this.props.code + ")")
      this.onStatusChanged();
    }
  }

  onWalletEvent = data => {
    if (data.type !== 'wallet' || data.code !== this.props.code) {
      return;
    }
    switch (data.data) {
    case 'statusChanged':
      this.onStatusChanged();
      break;
    case 'syncdone':
      this.onWalletChanged();
      break;
    }
  }

  onStatusChanged = () => {
    console.log("Wallet " + this.props.code + " requesting status.")
    apiGet("wallet/" + this.props.code + "/status").then(status => {
      if (status == "initialized") {
        this.setState({
          walletInitialized: true,
          walletConnected: true,
          isReceive: false,
          isSend: false,
        });
      } else if (status == "connected") {
        this.setState({
          walletInitialized: false,
          walletConnected: true,
        });
      } else {
        this.setState({
          walletInitialized: false,
          walletConnected: false,
        });
      }
      this.onWalletChanged();
    });
  }

  onWalletChanged = () => {
    if (this.state.walletInitialized && this.state.walletConnected) {
      console.log("Wallet " + this.props.code + " initialized.");
      apiGet('wallet/' + this.props.code + '/transactions').then(transactions => {
        this.setState({ transactions });
      });
      apiGet('wallet/' + this.props.code + '/balance').then(balance => {
        this.setState({ balance });
      });
    } else {
      console.log("Wallet " + this.props.code + " disconnected. Should rerender");
      this.setState({
        balance: {
          available: 0,
          hasIncoming: false,
          incoming: 0,
        },
      });
    }
  }

  render({
    wallets,
  }, {
    walletInitialized,
    transactions,
    walletConnected,
    balance,
    isReceive,
    isSend,
  }) {
    const wallet = wallets.find(({ code }) => code === this.props.code);
    if (!wallet) return null;
    return (
      <div class="container">
        {
          (!isReceive && !isSend) && (
            <div class="innerContainer">
              <div class="header">
                <Balance name={wallet.name} amount={balance.available} unit={balance.unit}>
                  {
                    balance.hasIncoming && (
                      <h5 class={style.pendingBalance}>{balance.incoming} Pending</h5>
                    )
                  }
                </Balance>
                <div class={[componentStyle.buttons].join(' ')}>
                  <button class={[componentStyle.button, componentStyle.isPrimary].join(' ')} onClick={() => this.setState({ isReceive: true })}>Receive</button>
                  <button class={[componentStyle.button, componentStyle.isPrimary].join(' ')} onClick={() => this.setState({ isSend: true })}>Send</button>
                </div>
              </div>
              <div class="content">
                {
                  !walletInitialized ? (
                    <div class="flex flex-row flex-center">
                      <p style="font-weight: bold;">Initializing...</p>
                    </div>
                  ) : (
                    <Transactions
                      explorerURL={wallet.blockExplorerTxPrefix}
                      transactions={transactions}
                    />
                  )
                }
                <div class={style.connectionStatusContainer}>
                  {
                    walletConnected ? (
                      <div class={[style.connectionStatus, style.success].join(' ')}>
                        <p>Connection established</p>
                      </div>
                    ) : (
                      <div class={[style.connectionStatus, style.warning].join(' ')}>
                        <p>Connection lost. Retrying...</p>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          )
        }
        {
          isReceive && (
            <Receive
              code={this.props.code}
              onClose={() => this.setState({ isReceive: false })}
            />
          )
        }
        {
          isSend && (
            <Send
              walletCode={wallet.code}
              walletInitialized={walletInitialized}
              onClose={() => this.setState({ isSend: false })}
            />
          )
        }
      </div>
    );
  }
}