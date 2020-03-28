import React from "react";
import Authentication from "../../util/Authentication/Authentication";
import Creator from "../Creator/Creator";
import "./Config.css";
import Grid from "../Grid/Grid";
import database from "../../util/Database/Database";

export default class ConfigPage extends React.Component {
  constructor(props) {
    super(props);
    this.Authentication = new Authentication();

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      finishedLoading: false,
      theme: "light",
      configuration: { currentOpen: "" }
    };
  }

  contextUpdate(context, delta) {
    if (delta.includes("theme")) {
      this.setState(() => {
        return { theme: context.theme };
      });
    }
  }

  componentDidMount() {
    // do config page setup as needed here
    if (this.twitch) {
      this.twitch.onAuthorized(auth => {
        this.Authentication.setToken(auth.token, auth.userId);
        if (!this.state.finishedLoading) {
          // if the component hasn't finished loading (as in we've not set up after getting a token), let's set it up now.

          // now we've done the setup for the component, let's set the state to true to force a rerender with the correct data.
          var parts = auth.token.split(".");
          var payload = JSON.parse(window.atob(parts[1]));
          var streamer_id = payload.channel_id;

          this.setState(() => {
            return { finishedLoading: true, channelId: streamer_id };
          });
          fetch(
            `https://bingo-3e03d.firebaseio.com/streamer/${streamer_id}.json`
          )
            .then(result => result.json())
            .then(configuration => {
              if (configuration == null || configuration.currentOpen == null)
                this.setState({
                  configuration: { bingos: [], currentOpen: "" }
                });
              else this.setState({ configuration });
            });
        }
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });
    }
  }

  handleOnChange = event => {
    const currentOpen = event.target.value;
    const configuration = { ...this.state.configuration };
    configuration.currentOpen = currentOpen;
    this.setState({ configuration }, () => {
      fetch(
        `https://bingo-3e03d.firebaseio.com/streamer/${this.state.channelId}.json`,
        {
          method: "PATCH",
          body: JSON.stringify({ currentOpen: currentOpen })
        }
      );
    });
  };

  handleOnCreate = (name, rows, cols) => {
    const grid = Array(rows)
      .fill()
      .map(() =>
        Array(cols)
          .fill()
          .map(() => ({ values: [""], validate: false, nbValidate: 0 }))
      );

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    fetch(
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.channelId}/bingos.json`,
      {
        method: "POST",
        body: JSON.stringify({ name: name, grid: grid })
      }
    )
      .then(result => result.json())
      .then(currentOpen => {
        console.log(currentOpen);
        fetch(
          `https://bingo-3e03d.firebaseio.com/streamer/${this.state.channelId}.json`,
          {
            method: "PATCH",
            body: JSON.stringify({ currentOpen: currentOpen.name })
          }
        );
      })
      .then(() => setTimeout(() => this.reloadConfig(), 200));
  };

  handleChange = (i, j, value) => {
    const configuration = { ...this.state.configuration };
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];
    currentOpen.grid[i][j].values[0] = value;
    this.setState({ configuration });
  };

  handleCheck = (i, j) => {
    const configuration = { ...this.state.configuration };
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];
    currentOpen.grid[i][j].validate = !currentOpen.grid[i][j].validate;
    this.setState({ configuration }, () => this.handleSave());
  };

  handleReset = () => {
    const configuration = { ...this.state.configuration };
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];
    currentOpen.grid.map(rows =>
      rows.map(element => {
        element.validate = false;
        element.nbValidate = 0;
      })
    );
    this.setState({ configuration }, () => this.handleSave());
  };

  handleShuffle = () => {
    const configuration = { ...this.state.configuration };
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];

    currentOpen.grid.forEach((rows, i) => {
      rows.forEach((cell, j) => {
        const x = Math.floor(Math.random() * currentOpen.grid.length);
        const y = Math.floor(Math.random() * rows.length);
        const temp = currentOpen.grid[x][y];
        currentOpen.grid[x][y] = currentOpen.grid[i][j];
        currentOpen.grid[i][j] = temp;
      });
    });
    this.setState({ configuration }, () => this.handleSave());
  };

  handleSave = () => {
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];
    fetch(
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.channelId}/bingos.json`,
      {
        method: "PATCH",
        body: JSON.stringify({ [key]: currentOpen })
      }
    ).then(() => this.reloadConfig());
  };

  reloadConfig() {
    fetch(
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.channelId}.json`
    )
      .then(result => result.json())
      .then(configuration => this.setState({ configuration }));
  }

  render() {
    if (this.state.finishedLoading && this.Authentication.isModerator()) {
      return (
        <div className="Config">
          <div
            className={
              this.state.theme === "light" ? "Config-light" : "Config-dark"
            }
          >
            <select
              value={this.state.configuration.currentOpen}
              onChange={this.handleOnChange}
              className="Config-select"
            >
              <option value="">--Nouveau bingo--</option>
              {this.state.configuration.bingos &&
                Object.keys(this.state.configuration.bingos).map(bingo => (
                  <option value={bingo} key={bingo}>
                    {this.state.configuration.bingos[bingo].name}
                  </option>
                ))}
            </select>
            <div className="Config-content">
              {this.state.configuration &&
              this.state.configuration.currentOpen === "" ? (
                <Creator
                  onCreate={this.handleOnCreate}
                  theme={this.state.theme}
                />
              ) : (
                <Grid
                  bingoGrid={
                    this.state.configuration.bingos[
                      this.state.configuration.currentOpen
                    ].grid
                  }
                  handleChange={this.handleChange}
                  handleCheck={this.handleCheck}
                  handleReset={this.handleReset}
                  handleShuffle={this.handleShuffle}
                  handleSave={this.handleSave}
                  streamer
                />
              )}
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="Config">
          <div
            className={
              this.state.theme === "light" ? "Config-light" : "Config-dark"
            }
          >
            Loading...
          </div>
        </div>
      );
    }
  }
}
