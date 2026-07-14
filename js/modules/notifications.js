/** Notificações locais (Web Notification API / Capacitor LocalNotifications). */
import { toast } from '../utils/dom.js';
import { daysBetween, todayStr } from '../utils/date.js';
import { money } from '../utils/format.js';

const isCapacitor = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

export async function requestNotificationPermission() {
  if (isCapacitor() && window.Capacitor.Plugins?.LocalNotifications) {
    const { display } = await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
    return display === 'granted';
  }
  if ('Notification' in window) {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  }
  return false;
}

async function scheduleNative(entry, diff) {
  const at = new Date(); at.setSeconds(at.getSeconds() + 4);
  await window.Capacitor.Plugins.LocalNotifications.schedule({
    notifications: [{
      id: Math.floor(Math.random() * 100000),
      title: 'Conta a vencer',
      body: `${entry.title} · ${money(entry.amount)} · vence em ${diff} dia(s)`,
      schedule: { at }
    }]
  });
}

function showWebNotification(entry, diff) {
  if (Notification.permission !== 'granted') return;
  new Notification('Conta a vencer', { body: `${entry.title} · ${money(entry.amount)} · vence em ${diff} dia(s)` });
}

export async function checkDueSoonAndNotify(entries) {
  const dueSoon = entries.filter((e) => e.type === 'despesa' && e.status === 'pendente' && e.dueDate && daysBetween(todayStr(), e.dueDate) >= 0 && daysBetween(todayStr(), e.dueDate) <= 3);
  if (!dueSoon.length) return;

  for (const entry of dueSoon) {
    const diff = daysBetween(todayStr(), entry.dueDate);
    if (isCapacitor() && window.Capacitor.Plugins?.LocalNotifications) {
      await scheduleNative(entry, diff);
    } else if ('Notification' in window && Notification.permission === 'granted') {
      showWebNotification(entry, diff);
    } else {
      toast(`Atenção: ${entry.title} vence em ${diff} dia(s).`);
    }
  }
}
