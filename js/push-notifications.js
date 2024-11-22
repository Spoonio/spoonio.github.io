
window.pushNotifications = {
	requestPermission: async function () {
		const permission = await Notification.requestPermission();
		return permission;
	},

	isServiceWorkerReady: async function () {
		const registration = await navigator.serviceWorker.ready;
		return registration != null;
	},

	subscribeToPush: async function () {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey:
				//urlBase64ToUint8Array(
				"BPxrKmqYd-BYe3HsED-STsjSqGMzYJfYN1i_KEqjFPadZIqLF6OdBD0vriMiJvdrqwEar-7hc_tVx0dvkiKgHPo"
				//)
		});
		return JSON.stringify(subscription);
	},

	unsubscribe: async function () {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		if (subscription) {
			const result = await subscription.unsubscribe();
			return result;
		}
		return false;
	},

	getSubscription: async function () {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();
		return subscription != null
			? JSON.stringify(subscription)
			: '';
	}
};

function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - base64String.length % 4) % 4);
	const base64 = (base64String + padding)
		.replace(/-/g, '+')
		.replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}