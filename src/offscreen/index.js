import './message-listener';

// Automa API message listener - runs in offscreen document where WorkflowManager is available
// Messages from CDP (service worker) can reach offscreen document
import AutomaApiMessageListener from '@/automa-api/message-listener';
import Browser from 'webextension-polyfill';

Browser.runtime.onMessage.addListener(AutomaApiMessageListener.listener);