import { findByProps } from '@vendetta/metro';
import { before } from '@vendetta/patcher';
import { storage } from '@vendetta/plugin';
import { defaultRules } from './rules';

storage.cleanedUrls ??= {};

const MessageActions = findByProps('sendMessage', 'receiveMessage');
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

const ruleToRegex = (rule: string): RegExp => {
    const [pattern, domain] = rule.split('@');
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*');

    if (!domain) return new RegExp(`[?&]${escapedPattern}=[^&]+`, 'g');

    const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('\\*', '.*');
    return new RegExp(`[?&]${escapedPattern}=[^&]+(?=.*${escapedDomain})`, 'g');
};

const TRACKING_PATTERNS = defaultRules.map(ruleToRegex);

const cleanUrl = (url: string): string => {
    if (!url) return url;

    try {
        return TRACKING_PATTERNS.reduce((cleaned, pattern) => cleaned.replace(pattern, ''), url)
            .replace(/[?&]$/, '')
            .replace(/&&+/g, '&')
            .replace(/\?&/g, '?');
    } catch {
        return url;
    }
};

const cleanMessageContent = (content: string): string => {
    const urls = content.match(URL_REGEX);
    if (!urls) return content;

    return urls.reduce((newContent, url) => {
        const cleaned = cleanUrl(url);
        if (cleaned === url) return newContent;

        storage.cleanedUrls[url] = cleaned;
        return newContent.replace(url, cleaned);
    }, content);
};

const patches: (() => void)[] = [];

export const onLoad = () => {
    patches.push(
        before('sendMessage', MessageActions, (args) => {
            if (!args?.[1]?.content) return;
            args[1].content = cleanMessageContent(args[1].content);
        }),
        before('receiveMessage', MessageActions, (args) => {
            if (!args?.[0]?.content) return;
            args[0].content = cleanMessageContent(args[0].content);
        })
    );
};

export const onUnload = () => {
    patches.forEach((unpatch) => unpatch());
};
