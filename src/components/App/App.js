import React from "react";
import Authentication from "../../util/Authentication/Authentication";

import "./App.css";
import Grid from "../Grid/Grid";
import database from "../../util/Database/Database";

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.Authentication = new Authentication();

    //if the extension is running on twitch or dev rig, set the shorthand here. otherwise, set to null.
    this.twitch = window.Twitch ? window.Twitch.ext : null;
    this.state = {
      finishedLoading: false,
      theme: "light",
      isVisible: false,
      configuration: { bingos: {}, currentOpen: "" }
    };
  }

  contextUpdate(context, delta) {
    if (delta.includes("theme")) {
      this.setState(() => {
        return { theme: context.theme };
      });
    }
  }

  visibilityChanged(isVisible) {
    this.setState(() => {
      return {
        isVisible
      };
    });
  }

  componentDidMount() {
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
            return {
              finishedLoading: true,
              channelId: streamer_id,
              isVisible: true
            };
          });

          setInterval(() => {
            fetch(
              `https://bingo-3e03d.firebaseio.com/streamer/${streamer_id}.json`
            )
              .then(result => result.json())
              .then(configuration => this.setState({ configuration }));
          }, 2000);
        }
      });

      this.twitch.onVisibilityChanged((isVisible, _c) => {
        this.visibilityChanged(isVisible);
      });

      this.twitch.onContext((context, delta) => {
        this.contextUpdate(context, delta);
      });
    }
  }

  componentWillUnmount() {
    if (this.twitch) {
      this.twitch.unlisten("broadcast", () =>
        console.log("successfully unlistened")
      );
    }
  }

  render() {
    if (
      this.state.finishedLoading &&
      this.state.isVisible &&
      this.state.configuration.currentOpen !== ""
    ) {
      return (
        <div className={this.props.type === "mobile" ? "App-mobile" : "App"}>
          <div
            className={this.state.theme === "light" ? "App-light" : "App-dark"}
          >
            <Grid
              bingoGrid={
                this.state.configuration.bingos[
                  this.state.configuration.currentOpen
                ].grid
              }
              type={this.props.type}
            />
          </div>
        </div>
      );
    } else {
      return <div className="App"></div>;
    }
  }
}
