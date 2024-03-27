/**
 * To avoid duplicating logic everywhere. 
 */

const quickTaskUtils = {
  getProgressPercent(quickTask) {
    if(!quickTask) {
      return 0
    } else if(quickTask.status === 'closed') {
      // If it's closed we'll call it done.
      return 100
    } else if(quickTask.type === 'file') {
      // This one is tricky. If we only allow one file per task it's easy, otherwise it get's complicated.
      return 0
    } else if(quickTask.type === 'signature') {
      const signaturesRequested = quickTask.signingLinks.length;
      const signaturesCompleted = quickTask.signingLinks.filter(link => link.responseDate).length;
      return Math.floor((signaturesCompleted / signaturesRequested) * 100)
    }
  }
  , getUserSigningLink(quickTask, user) {
    // NOTE: singingLinks is an array of objects. Filter it down by comparing the signatoryEmail with the user's email.
    if(quickTask && user) {
      const signingLinkObj = quickTask.signingLinks.filter(link => link.signatoryEmail == user.username)[0];
      if(signingLinkObj && signingLinkObj.url) {
        return signingLinkObj;
      } else {
        return null
      }
    } else {
      return null
    }
  }
}

export default quickTaskUtils;