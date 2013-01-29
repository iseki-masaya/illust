window.addEventListener("load", function () {
	//定数
	var STEP_COUNT = 200;
	var THRESHOLD_DIST = 0.8;

	//mousedownの状態か判断する変数
	var isDown = false;

	//ブラシの状態
	var brushState = "LINE";

	//移動距離の総和
	var sumDistance = 0;

	//テクスチャのパラメータ
	var opacity = 230;

	//座標
	var controllPoint2 = {x:0, y:0};
	var controllPoint1 = {x:0, y:0};
	var start;
	var end;

	//キャンバスの大きさ
	var w = 320;
	var h = 450;

	//canvasの初期設定
	var canvas = document.getElementById("myCanvas");
	var c = canvas.getContext("2d");
	canvas.width = w;
	canvas.height = h;
	c.strokeStyle = "rgba(0,250,0,1.0)";
	c.lineWidth = 5;
	c.lineJoin = "round";
	c.lineCap = "round";
	c.shadowBlur = 0;

	//テクスチャの設定
	var textureCanvas = document.createElement("canvas");
	var texCan = textureCanvas.getContext("2d");
	var textureImage = new Image();
	textureImage.src = "../img/pen_mini.png";
	var texture;
	var pixels;
	textureImage.onload = function () {
		texCan.drawImage(textureImage, 0, 0);
		texture = texCan.getImageData(0, 0, textureImage.width, textureImage.height);
		pixels = texture.data;
	}

	// タッチイベントの初期化
	document.addEventListener("touchstart", multiTouchHandler, false);
	document.addEventListener("touchmove", multiTouchHandler, false);
	document.addEventListener("touchend", multiTouchHandler, false);
	// ジェスチャーイベントの初期化
	document.addEventListener("gesturestart", multiTouchHandler, false);
	document.addEventListener("gesturechange", multiTouchHandler, false);
	document.addEventListener("gestureend", multiTouchHandler, false);

	//スクロールを抑止
	//これをしないと描画ができない
	function multiTouchHandler(event) {
		event.preventDefault();
		end = getPosT(event);
	}

	//イベントの座標を取得
	function getPosT(event) {
		var X, Y;
		if (event.touches) {
			X = event.touches[0].clientX - canvas.offsetTop;
			Y = event.touches[0].clientY - canvas.offsetLeft;
		} else {
			X = event.clientX - canvas.offsetTop;
			Y = event.clientY - canvas.offsetLeft;
		}
		return {
			x:X,
			y:Y
		};
	}

	//改良型Bスプライン曲線
	function getBsplinePoint(t) {
		//戻り値
		var spline = {x:0, y:0};
		//制御点
		var p0 = controllPoint2;
		var p1 = controllPoint1;
		var p2 = start;
		var p3 = end;
		var S = 1.0 / 6.0;
		var t2 = t * t;
		var t3 = t2 * t;

		var m = Array
			(
				Array(-1, 3, -3, 1),
				Array(3, -6, 3, 0),
				Array(-3, 0, 3, 0),
				Array(1, 4, 1, 0)
			);

		spline.x = S * (
			(p0.x * m[0][0] + p1.x * m[0][1] + p2.x * m[0][2] + p3.x * m[0][3] ) * t3 +
				(p0.x * m[1][0] + p1.x * m[1][1] + p2.x * m[1][2] + p3.x * m[1][3] ) * t2 +
				(p0.x * m[2][0] + p1.x * m[2][1] + p2.x * m[2][2] + p3.x * m[2][3] ) * t +
				(p0.x * m[3][0] + p1.x * m[3][1] + p2.x * m[3][2] + p3.x * m[3][3] )   );
		spline.y = S * (
			(p0.y * m[0][0] + p1.y * m[0][1] + p2.y * m[0][2] + p3.y * m[0][3] ) * t3 +
				(p0.y * m[1][0] + p1.y * m[1][1] + p2.y * m[1][2] + p3.y * m[1][3] ) * t2 +
				(p0.y * m[2][0] + p1.y * m[2][1] + p2.y * m[2][2] + p3.y * m[2][3] ) * t +
				(p0.y * m[3][0] + p1.y * m[3][1] + p2.y * m[3][2] + p3.y * m[3][3] )   );

		return {
			x:spline.x,
			y:spline.y
		};
	}

	//テクスチャの色を変更するメソッド
	function setTextureColor(red, blue, green) {
		for (var y = 0; y < texture.height; y++) {
			for (var x = 0; x < texture.width; x++) {
				pixels[(x + texture.width * y) * 4] = red;
				pixels[(x + texture.width * y) * 4 + 1] = blue;
				pixels[(x + texture.width * y) * 4 + 2] = green;
			}
		}
	}

	//スタート時のイベント
	canvas.addEventListener("touchstart", function (event) {
		start = getPosT(event);
	}, false);
	canvas.addEventListener("mousedown", function (event) {
		start = getPosT(event);
		isDown = true;
	}, false);

	//終了時のイベント
	canvas.addEventListener("touchend", function () {
		controllPoint2 = {x:0, y:0};
		controllPoint1 = {x:0, y:0};
	}, false);
	canvas.addEventListener("mouseup", function () {
		controllPoint2 = {x:0, y:0};
		controllPoint1 = {x:0, y:0};
		isDown = false;
	}, false);

	//移動中のイベント
	canvas.addEventListener("touchmove",function(event){
		renderLine(event);
	}, false);
	canvas.addEventListener("mousemove",function(event){
		if(isDown)
			renderLine(event);
	}, false);

	function renderLine(event) {
		//媒介変数
		var nextParameter;
		var parameter;
		//Bスプラインを保存するプロパティ
		var bSpline;
		//分割間の次の座標
		var nextPos;
		//パスを閉じているか判断
		var first = true;

		//color
		var red = parseInt(255 * Math.random());
		var green = parseInt(255 * Math.random());
		var blue = parseInt(255 * Math.random());
		var alpha = Math.random();
		c.strokeStyle = 'rgba(' + red + ',' + green + ',' + blue + ',' + alpha + ')';

		end = getPosT(event);
		for (var i = 0; i < STEP_COUNT - 1; i++) {
			if (controllPoint2.x && controllPoint2.y) {
				parameter = i / STEP_COUNT;
				nextParameter = (i + 1) / STEP_COUNT;
				bSpline = getBsplinePoint(nextParameter);
				nextPos = bSpline;
				bSpline = getBsplinePoint(parameter);
				sumDistance += Math.sqrt((nextPos.x - bSpline.x) * (nextPos.x - bSpline.x) + (nextPos.y - bSpline.y) * (nextPos.y - bSpline.y));
				if (sumDistance > THRESHOLD_DIST) {

					if (first) {
						c.beginPath();
						c.moveTo(bSpline.x, bSpline.y);
						first = false;
					} else {
						c.lineTo(bSpline.x, bSpline.y);
						c.closePath();
						c.stroke();
						first = true;
					}


					sumDistance -= THRESHOLD_DIST;
				}
			}
		}
		c.closePath();
		c.stroke();
		//座標データをシフトさせる。
		controllPoint2 = controllPoint1;
		controllPoint1 = start;
		start = end;
	}
}, false);