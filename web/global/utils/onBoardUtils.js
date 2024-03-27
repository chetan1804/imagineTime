/**
 * Checks user onBoarding status.
 */

const onBoardUtils = {
  getOnBoardedProgress(user, client) {
    // console.log('getting onboard progress', user, client);
    return (
      {
        userAddress: user && (user.onBoarded || user._primaryAddress)
        , userPhone: user && (user.onBoarded || user._primaryPhone)
        , clientAddress: client && (client.onBoarded || client._primaryAddress)
        , clientPhone: client && (client.onBoarded || client._primaryPhone)
      }
    )
  }
}

export default onBoardUtils;