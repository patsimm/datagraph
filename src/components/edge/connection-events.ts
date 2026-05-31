export class PortConnectionInitiatedEvent extends CustomEvent<{
  startPortKey: string;
}> {
  static EVENT_NAME = "port-connection-initiated" as const;

  constructor(startPortKey: string) {
    super(PortConnectionInitiatedEvent.EVENT_NAME, { detail: { startPortKey } });
  }
}

export class PortConnectionCompletedEvent extends CustomEvent<{
  startPortKey: string;
  endPortKey: string;
}> {
  static EVENT_NAME = "port-connection-completed" as const;

  constructor(startPortKey: string, endPortKey: string) {
    super(PortConnectionCompletedEvent.EVENT_NAME, { detail: { startPortKey, endPortKey } });
  }
}
