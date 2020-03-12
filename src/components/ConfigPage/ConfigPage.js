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
      selectedGrid: [],
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
          this.setState(() => {
            return { finishedLoading: true, channelId: auth.channelId };
          });
          this.twitch.rig.log("Loading ...");
          database.ref(`streamer/${auth.channelId}`).on("value", snapshot => {
            let configuration = { bingos: [], currentOpen: "" };
            if (snapshot.val() != null) {
              try {
                configuration = JSON.parse(snapshot.val());
              } catch (e) {}
            }
            this.setState({ configuration }, () =>
              console.log(this.state.configuration)
            );
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
    this.setState({ configuration });
  };

  handleOnCreate = (name, rows, cols) => {
    const grid = Array(rows)
      .fill()
      .map(() =>
        Array(cols)
          .fill()
          .map(() => ({ values: [""], validate: false, nbValidate: 0 }))
      );

    const bingo = { name, grid };
    const configuration = { ...this.state.configuration };
    configuration.bingos.push(bingo);
    configuration.currentOpen = bingo.name;
    this.setState({ configuration });
    this.saveConfiguration();
  };

  handleChange = (i, j, value) => {
    const configuration = { ...this.state.configuration };
    configuration.bingos[configuration.currentOpen].grid[i][
      j
    ].values[0] = value;
    this.setState({ configuration });
    this.saveConfiguration();
  };

  handleCheck = (i, j) => {
    const configuration = { ...this.state.configuration };
    const currentOpen = [...configuration.bingos[configuration.currentOpen]];
    currentOpen.grid[i][j].validate = !currentOpen.grid[i][j].validate;
    this.setState({ configuration });
    this.saveConfiguration();
  };

  handleReset = () => {
    const configuration = { ...this.state.configuration };
    const currentOpen = [...configuration.bingos[configuration.currentOpen]];
    currentOpen.grid.map(rows =>
      rows.map(element => {
        element.validate = false;
        element.nbValidate = 0;
      })
    );
    this.setState({ configuration });
    this.saveConfiguration();
  };

  handleShuffle = () => {
    const configuration = { ...this.state.configuration };
    const currentOpen = [...configuration.bingos[configuration.currentOpen]];
    currentOpen.grid.forEach((rows, i) => {
      rows.forEach((cell, j) => {
        const x = Math.floor(Math.random() * currentOpen.grid.length);
        const y = Math.floor(Math.random() * rows.length);
        const temp = currentOpen.grid[x][y];
        selectedGrid[x][y] = selectedGrid[i][j];
        selectedGrid[i][j] = temp;
      });
    });
    this.setState({ configuration });
    this.saveConfiguration();
  };

  saveConfiguration() {
    database
      .ref(`streamer/${this.state.channelId}`)
      .set(JSON.stringify(this.state.configuration));
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
              value={this.state.selectedBingo}
              onChange={this.handleOnChange}
              className="Config-select"
            >
              <option value="">--Nouveau bingo--</option>
              {this.state.configuration.bingos &&
                this.state.configuration.bingos.map(bingo => (
                  <option value={bingo.name} key={bingo.name}>
                    {bingo.name}
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
