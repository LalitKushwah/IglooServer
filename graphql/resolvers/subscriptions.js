import {
  subscriptionFilterOnlyMine,
  subscriptionFilterOwnedOrShared,
  socketToDeviceMap,
  authorized,
  deviceToParents,
  logErrorsPromise,
  instancesToSharedIds,
} from './utilities'

const subscriptionResolver = (pubsub, { User, Device, Board }) => ({
  boardShared: subscriptionFilterOnlyMine('boardShared', pubsub),
  deviceShared: subscriptionFilterOnlyMine('deviceShared', pubsub),
  valueShared: subscriptionFilterOnlyMine('valueShared', pubsub),
  boardStoppedSharing: subscriptionFilterOnlyMine(
    'boardStoppedSharing',
    pubsub,
  ),
  deviceStoppedSharing: subscriptionFilterOnlyMine(
    'deviceStoppedSharing',
    pubsub,
  ),
  valueStoppedSharing: subscriptionFilterOnlyMine(
    'valueStoppedSharing',
    pubsub,
  ),
  boardCreated: subscriptionFilterOnlyMine('boardCreated', pubsub),
  deviceCreated: subscriptionFilterOwnedOrShared('deviceCreated', pubsub),
  valueCreated: subscriptionFilterOwnedOrShared('valueCreated', pubsub),
  tokenCreated: subscriptionFilterOnlyMine('tokenCreated', pubsub),
  plotNodeCreated: subscriptionFilterOwnedOrShared('plotNodeCreated', pubsub),
  stringPlotNodeCreated: subscriptionFilterOwnedOrShared(
    'stringPlotNodeCreated',
    pubsub,
  ),
  notificationCreated: subscriptionFilterOwnedOrShared(
    'notificationCreated',
    pubsub,
  ),
  userUpdated: subscriptionFilterOnlyMine('userUpdated', pubsub),
  deviceUpdated: subscriptionFilterOwnedOrShared('deviceUpdated', pubsub),
  boardUpdated: subscriptionFilterOwnedOrShared('boardUpdated', pubsub),
  valueUpdated: subscriptionFilterOwnedOrShared('valueUpdated', pubsub),
  plotNodeUpdated: subscriptionFilterOwnedOrShared('plotNodeUpdated', pubsub),
  stringPlotNodeUpdated: subscriptionFilterOwnedOrShared(
    'stringPlotNodeUpdated',
    pubsub,
  ),
  notificationUpdated: subscriptionFilterOwnedOrShared(
    'notificationUpdated',
    pubsub,
  ),
  notificationDeleted: subscriptionFilterOwnedOrShared(
    'notificationDeleted',
    pubsub,
  ),
  valueDeleted: subscriptionFilterOwnedOrShared('valueDeleted', pubsub),
  deviceDeleted: subscriptionFilterOwnedOrShared('deviceDeleted', pubsub),
  boardDeleted: subscriptionFilterOwnedOrShared('boardDeleted', pubsub),
  plotNodeDeleted: subscriptionFilterOwnedOrShared('plotNodeDeleted', pubsub),
  stringPlotNodeDeleted: subscriptionFilterOwnedOrShared(
    'stringPlotNodeDeleted',
    pubsub,
  ),
  tokenDeleted: subscriptionFilterOnlyMine('tokenDeleted', pubsub),
  keepOnline: {
    subscribe: (root, args, context) =>
      logErrorsPromise(
        'keepOnlineSubscription',
        1000,
        authorized(
          args.deviceId,
          context,
          Device,
          User,
          2,
          async (resolve, reject, deviceFound, deviceAndBoard) => {
            const newDevice = await deviceFound.update({ online: true })
            const userIds = await instancesToSharedIds(deviceAndBoard)

            pubsub.publish('deviceUpdated', {
              deviceUpdated: newDevice.dataValues,
              userIds,
            })

            socketToDeviceMap[context.websocket] = {
              deviceId: args.deviceId,
              userIds,
            }

            resolve(pubsub.asyncIterator('bogusIterator')) // this iterator will never send any data
          },
          deviceToParents(Board),
        ),
      ),
  },
})
export default subscriptionResolver
