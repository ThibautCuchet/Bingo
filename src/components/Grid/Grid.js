import React from "react";

import "./Grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      edit: false
    };
  }

  render() {
    return (
      <div>
        {this.props.streamer ? (
          <div className="Grid-action">
            {this.state.edit ? (
              <input
                type="button"
                value="Enregistrer"
                onClick={() => this.setState({ edit: false })}
              />
            ) : (
              <input
                type="button"
                value="Modifier"
                onClick={() => this.setState({ edit: true })}
              />
            )}
            <input
              type="button"
              value="Réinitialiser"
              onClick={() => this.props.handleReset()}
            />
            <input
              type="button"
              value="Mélanger"
              onClick={() => this.props.handleShuffle()}
            />
          </div>
        ) : (
          <div />
        )}
        <div className="Grid-table">
          {this.props.bingoGrid.map((row, i) => (
            <div className="Grid-rows" key={i}>
              {row.map((cell, j) => (
                <div
                  className={cell.checked ? "Grid-cell-checked" : "Grid-cell"}
                  key={j}
                  onClick={() => {
                    !this.state.edit &&
                      this.props.streamer &&
                      this.props.handleCheck(i, j);
                  }}
                >
                  <div className="Grid-title">
                    {this.state.edit ? (
                      <input
                        key={i + this.state.name + j}
                        type="text"
                        value={cell.name}
                        onChange={event =>
                          this.props.handleChange(i, j, event.target.value)
                        }
                      />
                    ) : (
                      cell.name
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
