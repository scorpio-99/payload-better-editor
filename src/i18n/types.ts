export type BetterEditorTranslations = {
  toggle: {
    open: string
    close: string
  }
  overlay: {
    dialogLabel: string
    resizeSidebar: string
  }
  toolbar: {
    undo: string
    undoTitle: string
    redo: string
    redoTitle: string
    enterFullscreen: string
    exitFullscreen: string
    switchToEdit: string
    switchToInteract: string
    switchToInteractShort: string
    showSidebar: string
    hideSidebar: string
  }
  viewport: {
    groupLabel: string
    desktop: string
    tablet: string
    mobile: string
    responsive: string
  }
  sidebar: {
    tabs: { page: string; block: string; settings: string }
    blockSelected: string
    noBlockSelected: string
    validationLabel: string
    validationSingular: string
    validationPlural: string
  }
  blocks: {
    emptyPrompt: string
    addBlock: string
    blockName: string
    blockNamePlaceholder: string
    schemaError: string
    drawerSingular: string
    drawerPlural: string
    deselect: string
    actions: {
      toolbar: string
      moveUp: string
      moveUpLabel: string
      moveDown: string
      moveDownLabel: string
      duplicate: string
      duplicateLabel: string
      addBelow: string
      addBelowLabel: string
      delete: string
      deleteLabel: string
    }
  }
  documentFields: {
    noFields: string
    noSettings: string
  }
  preview: {
    title: string
    loading: string
    resizeLeft: string
    resizeRight: string
  }
  error: {
    heading: string
    unknown: string
    tryAgain: string
    closeEditor: string
  }
  banner: {
    builtBy: string
    star: string
    github: string
    reportBug: string
  }
  settings: {
    globalLabel: string
    globalDescription: string
    adminGroup: string
    sidebar: {
      tabLabel: string
      tabDescription: string
      position: string
      positionRight: string
      positionLeft: string
      forceFullWidth: string
      forceFullWidthDesc: string
    }
    viewport: {
      tabLabel: string
      tabDescription: string
      tabletWidth: string
      mobileWidth: string
    }
    outline: {
      tabLabel: string
      tabDescription: string
      topLevelColor: string
      topLevelColorDesc: string
      nestedColor: string
      nestedColorDesc: string
      outlineWidth: string
      outlineWidthDesc: string
    }
    toolbar: {
      tabLabel: string
      tabDescription: string
      enabled: string
      anchorCorner: string
      topRight: string
      topLeft: string
      bottomRight: string
      bottomLeft: string
    }
    validation: {
      colorRequired: string
      colorInvalid: string
      mustBeNumber: string
      outlineRange: string
    }
  }
}
