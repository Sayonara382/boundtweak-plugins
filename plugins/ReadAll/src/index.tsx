import { ReactNative } from '@vendetta/metro/common';
import { findByProps, findByStoreName } from '@vendetta/metro';
import { showToast } from '@vendetta/ui/toasts';
import { getAssetIDByName } from '@vendetta/ui/assets';

interface Guild {
    id: string;
    name: string;
}

interface Channel {
    id: string;
}

interface ThreadJoined {
    channel: Channel;
    joinTimestamp: number;
}

interface ChannelReadState {
    channelId: string;
    messageId: string;
    readStateType: number;
}

interface ActiveJoinedThreadsStore {
    getActiveJoinedThreadsForGuild(guildId: string): Record<string, Record<string, ThreadJoined>>;
}

const ReadStateStore = findByStoreName('ReadStateStore');
const FluxDispatcher = findByProps('dispatch');
const GuildStore = findByStoreName('GuildStore');
const GuildChannelStore = findByStoreName('GuildChannelStore');
const ActiveJoinedThreadsStore: ActiveJoinedThreadsStore = findByStoreName('ActiveJoinedThreadsStore');

const getAllChannelsFromGuild = (guild: Guild): Channel[] => {
    const { SELECTABLE = [], VOCAL = [] } = GuildChannelStore.getChannels(guild.id) || {};
    const threadChannels = Object.values(ActiveJoinedThreadsStore.getActiveJoinedThreadsForGuild(guild.id)).flatMap(
        (threadChannels) => Object.values(threadChannels)
    );
    return [...SELECTABLE, ...VOCAL, ...threadChannels];
};

const getChannelId = (channel: Channel | ThreadJoined): string =>
    'channel' in channel ? channel.channel.id : channel.id;

const createChannelReadState = (channelId: string): ChannelReadState => ({
    channelId,
    messageId: ReadStateStore.lastMessageId(channelId),
    readStateType: 0
});

const markAllAsRead = (): void => {
    const unreadChannels = Object.values(GuildStore.getGuilds() as Record<string, Guild>)
        .flatMap((guild) => getAllChannelsFromGuild(guild))
        .map((channel) => getChannelId(channel))
        .filter((channelId) => channelId && ReadStateStore.hasUnread(channelId))
        .map(createChannelReadState);
    if (unreadChannels.length > 0) {
        FluxDispatcher.dispatch({
            type: 'BULK_ACK',
            context: 'APP',
            channels: unreadChannels
        });
    }
    showToast('All channels marked as read!', getAssetIDByName('Check'));
};

const MarkAllAsReadButton = () => {
    const { Text, TouchableOpacity } = ReactNative;
    return (
        <TouchableOpacity
            onPress={markAllAsRead}
            style={{
                backgroundColor: '#5865f2',
                padding: 12,
                margin: 8,
                borderRadius: 8,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center'
            }}
            activeOpacity={0.7}
        >
            <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600', textAlign: 'center' }}>
                Mark All as Read
            </Text>
        </TouchableOpacity>
    );
};

export const settings = () => {
    const { View, Text } = ReactNative;
    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#ffffff' }}>Read All</Text>
            <Text style={{ fontSize: 14, lineHeight: 20, marginBottom: 20, color: '#b9bbbe' }}>
                Quickly mark all unread notifications from server channels, voice channels, and threads as read with a
                single tap.
            </Text>
            <MarkAllAsReadButton />
        </View>
    );
};
