import React from "react";
import Authentication from "../../util/Authentication/Authentication";
import Creator from "../Creator/Creator";
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
      selectedBingo: "",
      selectedGrid: [],
      configuration: {}
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
            return { finishedLoading: true };
          });
        }
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });

      this.twitch.configuration.onChanged(() => {
        let configuration = this.twitch.configuration.broadcaster
          ? this.twitch.configuration.broadcaster.content
          : {};
        try {
          configuration = JSON.parse(configuration);
        } catch (e) {
          configuration = { bingos: [] };
        }

        this.setState({ configuration });
      });

      setInterval(() => {
        if (this.state.selectedBingo !== "")
          this.twitch.send(
            "broadcast",
            "application/json",
            JSON.stringify(this.state.selectedGrid)
          );
      }, 1000);
    }
  }

  handleOnChange = event => {
    const selectedBingo = event.target.value;
    this.setState({ selectedBingo }, () => this.selectGrid(selectedBingo));
  };

  handleOnCreate = (name, rows, cols) => {
    const grid = Array(rows)
      .fill()
      .map(() =>
        Array(cols)
          .fill(undefined)
          .map(() => ({ checked: false, name: "" }))
      );

    const bingo = { name, grid };
    const configuration = { ...this.state.configuration };
    configuration.bingos.push(bingo);
    this.setState({ configuration, selectedBingo: bingo.name }, () =>
      this.selectGrid(bingo.name)
    );
    this.saveConfiguration();
  };

  handleChange = (i, j, value) => {
    const selectedGrid = [...this.state.selectedGrid];
    selectedGrid[i][j].name = value;
    this.setState({ selectedGrid });
    this.saveConfiguration();
  };

  handleCheck = (i, j) => {
    const selectedGrid = [...this.state.selectedGrid];
    selectedGrid[i][j].checked = !selectedGrid[i][j].checked;
    this.setState({ selectedGrid });
    this.saveConfiguration();
  };

  handleReset = () => {
    const selectedGrid = [...this.state.selectedGrid];
    selectedGrid.map(rows => rows.map(element => (element.checked = false)));
    this.setState({ selectedGrid });
    this.saveConfiguration();
  };

  handleShuffle = () => {
    const selectedGrid = [...this.state.selectedGrid];
    selectedGrid.forEach((rows, i) => {
      rows.forEach((cell, j) => {
        const x = Math.floor(Math.random() * selectedGrid.length);
        const y = Math.floor(Math.random() * rows.length);
        const temp = selectedGrid[x][y];
        selectedGrid[x][y] = selectedGrid[i][j];
        selectedGrid[i][j] = temp;
      });
    });
    this.setState({ selectedGrid });
    this.saveConfiguration();
  };

  selectGrid(bingoName) {
    let selectedGrid = [];
    if (bingoName !== "") {
      selectedGrid = this.state.configuration.bingos.find(
        element => element.name === bingoName
      ).grid;
    }
    this.setState({ selectedGrid });
  }

  saveConfiguration() {
    this.twitch.configuration.set(
      "broadcaster",
      "1.0",
      JSON.stringify(this.state.configuration)
    );
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
              {this.state.selectedBingo === "" ? (
                <Creator
                  onCreate={this.handleOnCreate}
                  theme={this.state.theme}
                />
              ) : (
                <Grid
                  bingoGrid={this.state.selectedGrid}
                  bingoName={this.state.selectedBingo}
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
