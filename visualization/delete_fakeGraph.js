import * as THREE from "three";

export class FakeGraph {
	CLOUD_RADIUS = 200;
	SATELLITES_RADIUS = 50;
	SATELLITES_VERTICAL_OFFSET = 20;

	TOTAL_PARTIES = 8;
	TOTAL_SATELLITES = 14;
	cumulus = [];

	satellites = [];

	constructor(mode = "uniform") {
		this.cumulus = [];
		if (mode == "random") this.distributeNodesRandomly();
		else this.distributeNodesUniformly();
	}

	distributeNodesUniformly() {
		for (let i = 0; i < this.TOTAL_PARTIES; i++) {
			let ang = (2 * Math.PI * i) / this.TOTAL_PARTIES;

			const position = new THREE.Vector3(
				Math.cos(ang) * this.CLOUD_RADIUS,
				0,
				Math.sin(ang) * this.CLOUD_RADIUS
			);
			this.cumulus.push(position);
		}

		let HELIX_RADIUS = 20;
		for (let i = 0; i < this.TOTAL_SATELLITES; i++) {
			let ang = (2 * Math.PI * i) / this.TOTAL_SATELLITES;
			const position = new THREE.Vector3(
				Math.cos(ang) * HELIX_RADIUS,
				i * this.SATELLITES_VERTICAL_OFFSET,
				Math.sin(ang) * HELIX_RADIUS
			);
			this.satellites.push(position);
		}
	}

	distributeNodesRandomly() {
		for (let i = 0; i < this.TOTAL_PARTIES; i++) {
			const position = new THREE.Vector3(
				(-0.5 + Math.random()) * this.CLOUD_RADIUS,
				(-0.5 + Math.random()) * this.CLOUD_RADIUS,
				(-0.5 + Math.random()) * this.CLOUD_RADIUS
			);
			this.cumulus.push(position);
		}

		for (let i = 0; i < this.TOTAL_SATELLITES; i++) {
			let alfa = Math.random() * Math.PI * 2;
			let beta = (-0.5 + Math.random()) * Math.PI;

			const position = new THREE.Vector3(
				Math.cos(beta) * Math.cos(alfa) * this.SATELLITES_RADIUS,
				Math.cos(beta) * Math.sin(alfa) * this.SATELLITES_RADIUS,
				Math.sin(beta) * this.SATELLITES_RADIUS
			);
			this.satellites.push(position);
		}
	}

	getTotalNodes() {
		return this.TOTAL_PARTIES * this.TOTAL_SATELLITES;
	}

	getNode(number) {
		// total=totalStars*totalSatellites

		let cumulusNum = Math.floor(number / this.TOTAL_SATELLITES);
		let satelliteNum = number % this.TOTAL_SATELLITES;

		let position = this.cumulus[cumulusNum].clone();
		position.add(this.satellites[satelliteNum]);

		// la textura de bordes tiene un gradiente horizontal
		// para cada combinacion de estrella con estrella
		// en total son totalStars^2 gradientes

		const blockHeight = 1.0 / Math.pow(this.TOTAL_PARTIES, 2);

		let vTextureCoord = blockHeight / 2 + cumulusNum / this.TOTAL_PARTIES;
		console.log(vTextureCoord);

		return { position, vTextureCoord };
	}

	getTotalStars() {
		return this.TOTAL_PARTIES;
	}

	getTotalSatellites() {
		return this.TOTAL_SATELLITES;
	}

	pickRandomEdge() {
		let cases = ["inner", "between"];
		let origin, target;

		let caseNum = Math.floor(Math.pow(Math.random(), 4) * cases.length);

		let caseName = cases[caseNum];
		let fromSatellite, toSatellite;
		let gradientOffset = 0;

		switch (caseName) {
			case "inner":
				// elijo un cumulus al azar
				let cumulusNum = Math.floor(Math.random() * this.TOTAL_PARTIES);

				// elijo un satellite al azar
				fromSatellite = Math.floor(
					Math.random() * this.TOTAL_SATELLITES
				);
				// elijo otro satellite al azar
				toSatellite = Math.floor(Math.random() * this.TOTAL_SATELLITES);
				while (fromSatellite == toSatellite) {
					toSatellite = Math.floor(
						Math.random() * this.TOTAL_SATELLITES
					);
				}

				origin = new THREE.Vector3().addVectors(
					this.cumulus[cumulusNum],
					this.satellites[fromSatellite]
				);
				target = new THREE.Vector3().addVectors(
					this.cumulus[cumulusNum],
					this.satellites[toSatellite]
				);
				gradientOffset =
					(cumulusNum +
						(1.0 + cumulusNum) / (1.0 + this.TOTAL_PARTIES)) /
					this.TOTAL_PARTIES;
				break;

			case "between":
				// elijo un cumulus al azar
				let cumulusA = Math.floor(Math.random() * this.TOTAL_PARTIES);
				let cumulusB = Math.floor(Math.random() * this.TOTAL_PARTIES);
				while (cumulusB == cumulusA) {
					cumulusB = Math.floor(Math.random() * this.TOTAL_PARTIES);
				}

				// elijo un satellite al azar
				fromSatellite = Math.floor(
					Math.random() * this.TOTAL_SATELLITES
				);
				// elijo otro satellite al azar
				toSatellite = Math.floor(Math.random() * this.TOTAL_SATELLITES);

				origin = this.cumulus[cumulusA].clone();
				origin.add(this.satellites[fromSatellite]);
				target = this.cumulus[cumulusB].clone();
				target.add(this.satellites[toSatellite]);

				//
				gradientOffset =
					(cumulusA + (1.0 + cumulusB) / (1.0 + this.TOTAL_PARTIES)) /
					this.TOTAL_PARTIES;
				break;
		}
		return { origin, target, gradientOffset };
	}
}
