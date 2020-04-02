import React from "react";
import Authentication from "../../util/Authentication/Authentication";
import Creator from "../Creator/Creator";
import syncOn from "../../util/icons/sync-on.svg";
import syncOff from "../../util/icons/sync-off.svg";
import "./Config.css";
import Grid from "../Grid/Grid";

export default class ConfigPage extends React.Component {
  constructor(props) {
    super(props);
    this.Authentication = new Authentication();

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      finishedLoading: false,
      theme: "light",
      sync: false,
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
          var streamerId = payload.channel_id;

          this.setState(() => {
            return { finishedLoading: true, streamerId };
          });

          fetch(
            `https://bingo-3e03d.firebaseio.com/streamer/${streamerId}.json`
          )
            .then(result => result.json())
            .then(configuration => {
              if (configuration == null || configuration.currentOpen == null)
                this.setState({
                  configuration: { bingos: {}, currentOpen: "" }
                });
              else this.setState({ configuration });
            });

          setInterval(() => {
            if (this.state.sync) {
              this.reloadConfig();
            }
          }, 2000);
        }
      });

      this.twitch.configuration.onChanged(() => {
        let appConfig = this.twitch.configuration.global
          ? this.twitch.configuration.global.content
          : "";

        try {
          appConfig = JSON.parse(appConfig);
        } catch (e) {
          appConfig = {
            colors: { blank: "white", validate: "green", complete: "grey" }
          };
        }

        this.setState(() => {
          return {
            appConfig
          };
        });
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });

      setInterval(() => {
        const { currentOpen, bingos } = this.state.configuration;
        if (currentOpen !== "")
          this.twitch.send(
            "broadcast",
            "application/json",
            JSON.stringify(bingos[currentOpen].grid)
          );
      }, 2000);
    }
  }

  loadDatabase = configuration => {
    this.setState({ configuration });
  };

  handleOnChange = value => {
    const configuration = { ...this.state.configuration };
    configuration.currentOpen = value;
    this.setState({ configuration }, () => {
      fetch(
        `https://bingo-3e03d.firebaseio.com/streamer/${this.state.streamerId}.json`,
        {
          method: "PATCH",
          body: JSON.stringify({ currentOpen: value })
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
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.streamerId}/bingos.json`,
      {
        method: "POST",
        body: JSON.stringify({ name: name, grid: grid })
      }
    )
      .then(result => result.json())
      .then(currentOpen => {
        fetch(
          `https://bingo-3e03d.firebaseio.com/streamer/${this.state.streamerId}.json`,
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
    const grid = configuration.bingos[configuration.currentOpen].grid;
    grid[i][j].values[0] = value;
    this.setState({ configuration });
  };

  handleCheck = (i, j) => {
    const configuration = { ...this.state.configuration };
    const { bingos, currentOpen } = configuration;
    const grid = bingos[currentOpen].grid;
    grid[i][j].validate = !grid[i][j].validate;
    this.setState({ configuration }, () => this.saveConfiguration());
  };

  handleReset = () => {
    const configuration = { ...this.state.configuration };
    const { bingos, currentOpen } = configuration;
    const grid = bingos[currentOpen].grid;
    grid.map(rows => rows.map(cell => (cell.validate = false)));
    this.setState({ configuration }, () => this.saveConfiguration());
  };

  handleShuffle = () => {
    const configuration = { ...this.state.configuration };
    const { bingos, currentOpen } = configuration;
    const grid = bingos[currentOpen].grid;
    grid.forEach((rows, i) => {
      rows.forEach((cell, j) => {
        const x = Math.floor(Math.random() * grid.length);
        const y = Math.floor(Math.random() * rows.length);
        const temp = grid[x][y];
        grid[x][y] = grid[i][j];
        grid[i][j] = temp;
      });
    });
    this.setState({ configuration }, () => this.saveConfiguration());
  };

  saveConfiguration = () => {
    const key = this.state.configuration.currentOpen;
    const currentOpen = this.state.configuration.bingos[key];
    fetch(
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.streamerId}/bingos.json`,
      {
        method: "PATCH",
        body: JSON.stringify({ [key]: currentOpen })
      }
    ).then(() => this.reloadConfig());
  };

  reloadConfig() {
    fetch(
      `https://bingo-3e03d.firebaseio.com/streamer/${this.state.streamerId}.json`
    )
      .then(result => result.json())
      .then(configuration => this.setState({ configuration }));
  }

  render() {
    if (
      this.state.finishedLoading &&
      this.Authentication.isModerator() &&
      this.state.appConfig
    ) {
      return (
        <div className="Config">
          <div
            className={
              this.state.theme === "light" ? "Config-light" : "Config-dark"
            }
          >
            <div className="Config-actions">
              <select
                value={this.state.configuration.currentOpen}
                onChange={event => this.handleOnChange(event.target.value)}
                className="Config-select"
              >
                <option value="">--Nouveau bingo--</option>
                {this.state.configuration.bingos &&
                  Object.keys(this.state.configuration.bingos).map(key => (
                    <option value={key} key={key}>
                      {this.state.configuration.bingos[key].name}
                    </option>
                  ))}
              </select>
              {(this.state.streamerId == "88301612" ||
                this.state.streamerId == "131061241") && (
                <label
                  style={{ display: "flex", alignItems: "center" }}
                  onClick={() => this.setState({ sync: !this.state.sync })}
                >
                  <img src={this.state.sync ? syncOn : syncOff} />
                  <span
                    style={{
                      color: "black",
                      fontSize: 14,
                      userSelect: "none"
                    }}
                  >
                    {this.state.sync ? "Sync on" : "Sync off"}
                  </span>
                </label>
              )}
            </div>
            <div className="Config-content">
              {this.state.configuration.currentOpen === "" ? (
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
                  handleSave={this.saveConfiguration}
                  appConfig={this.state.appConfig}
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
