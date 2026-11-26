# Changelog

## [0.2.0](https://github.com/MrOUBDA/restomanager-pro/compare/restomanager-pro-v0.1.0...restomanager-pro-v0.2.0) (2026-11-26)


### Nouvelles fonctionnalités

* **menu:** implement menu management api, react ui and unit tests ([ea862a5](https://github.com/MrOUBDA/restomanager-pro/commit/ea862a55d7895bfc870f36065f89a32c5ebacfa9))
* **orders,room:** group reservations and orders by day with category sales stats ([2d15c0a](https://github.com/MrOUBDA/restomanager-pro/commit/2d15c0a64ac116e878bf7d14b0fb8b7c1320f5a8))
* **orders:** implement order taking, inter-service client, kds workflow and ui ([7dd27b1](https://github.com/MrOUBDA/restomanager-pro/commit/7dd27b1ad53d385cdce8cc1a682599b19bd15946))
* **reporting:** add sales summary endpoint, vat breakdown, csv export and ui ([8989f23](https://github.com/MrOUBDA/restomanager-pro/commit/8989f23b9194aa4697dae6f46b53864152d9b388))
* **reservations:** implement floor plan, table assignment, anti-overbooking and ui ([2e0e7ff](https://github.com/MrOUBDA/restomanager-pro/commit/2e0e7ff1973f693da450625219c335739dd5771c))
* **room:** add interactive 2d floor plan with admin drag-and-drop and live occupancy colors ([2677f2a](https://github.com/MrOUBDA/restomanager-pro/commit/2677f2a2e9fef26e2d2585abf9674455cdd4e26a))
* **room:** allow admin to add and delete tables in main hall or terrace ([47ec447](https://github.com/MrOUBDA/restomanager-pro/commit/47ec447c116fb14e36eb0b1071e3f369591d5ca5))
* **room:** group reservations by status category and day with guest counts ([407274e](https://github.com/MrOUBDA/restomanager-pro/commit/407274edaaaafa592ca3cf7829d068c66dae7e53))


### Corrections de bugs

* **nav:** display Statistique des ventes tab button and remove duplicate view block ([75b3d0f](https://github.com/MrOUBDA/restomanager-pro/commit/75b3d0f1277af8bd2ed9cf123f3230b67041dc9a))
* **room:** highlight tables with same-day confirmed reservations in blue on floor plan ([7544d20](https://github.com/MrOUBDA/restomanager-pro/commit/7544d20baf89e8922b9532b4513eb1242b339472))
* **security:** enforce role-based order status transitions between waiter and kitchen ([4320f50](https://github.com/MrOUBDA/restomanager-pro/commit/4320f50d7d0a7a9886e8cc68677b451c4caa8749))


### Documentation

* **readme:** add comprehensive up-to-date project documentation ([63ca58c](https://github.com/MrOUBDA/restomanager-pro/commit/63ca58cc39d2caf621e03f9845c782df4fb33e87))


### Intégration Continue & DevOps

* **devops:** add github actions pipeline, release-please and architecture readme ([efe859c](https://github.com/MrOUBDA/restomanager-pro/commit/efe859cf291fe93fc312f4d8f96d066df03c66a4))
* **frontend:** use npm install for cross-platform optional dependencies ([f66e07f](https://github.com/MrOUBDA/restomanager-pro/commit/f66e07fe42c43cc9a9ec4fb130889ffb825183ed))
* **release:** trigger release-please with updated workflow permissions ([a60d336](https://github.com/MrOUBDA/restomanager-pro/commit/a60d33642a80cd0a1c0d2de3066b4d2635a3d513))
* upgrade github actions to v5 and disable matrix fail-fast ([250e367](https://github.com/MrOUBDA/restomanager-pro/commit/250e3673673d329461f8973d9335b9cbf7c093a6))
