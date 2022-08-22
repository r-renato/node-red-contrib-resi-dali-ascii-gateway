"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Status = void 0;
class Status {
    constructor(node, nodeServer) {
        this.statusBroadcasting = null;
        this.statusResetter = null;
        this.statusVal = { fill: "grey", shape: "ring", text: "idle" };
        this.setStatus = (state) => {
            this.statusVal = { fill: "grey", shape: "ring", text: "idle" };
            clearTimeout(this.statusResetter);
            if (state) {
                this.statusVal['shape'] = "dot";
                this.statusResetter = setTimeout(() => { this.setStatus(false); }, 500);
            }
            else {
                this.statusVal['shape'] = "ring";
            }
            this.node.status(this.statusVal);
        };
        this.getStatus = () => {
            return (this.statusVal);
        };
        this.getStatusBroadcasting = () => {
            return (this.statusBroadcasting);
        };
        this.node = node;
        this.statusSender = nodeServer.getStatusBroadcaster();
        this.statusBroadcasting = this.statusSender.thenAgain((st) => {
            this.statusVal = Object.assign(this.statusVal, st);
            node.status(this.statusVal);
        });
    }
    ;
}
exports.Status = Status;
;
//# sourceMappingURL=shared-classes.js.map