"use strict";
//調整用のもの
// document.querySelector("#shoot").addEventListener("click", photoShoot);

//↓は本番コード

const video = document.querySelector("#video");
const canvas = document.createElement("canvas");
const outputred = document.querySelector("#outputred");
const outputblue = document.querySelector("#outputblue");
const outputyellow = document.querySelector("#outputyellow");
const outputpurple = document.querySelector("#outputpurple");
const outputgreen = document.querySelector("#outputgreen");
const closeshow = document.querySelector(".closeshow");
let autoPhotoInterval = null;
let colorChart = null; // チャートオブジェクトの参照
let totalCount = 0;
document
  .querySelector("#shoot")
  .addEventListener("click", toggleAutoPhotoShoot);
initVideoCamera();
initPhoto();
/**
 * 食べ物のデータの取得する
 */
let foodData = [];
async function fetchData(colors) {
  try {
    const response = await fetch("../datare.json"); // JSONファイルを取得
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json(); // JSONデータを取得して配列化
    console.log("取得したデータ:", data);
    foodData = data;
    console.log(foodData);
    let smallestDifference = Infinity;
    let closestFood = null;
    foodData.forEach((food, index) => {
      const nutrition = food.nutrition;

      // 各栄養素のパーセント値を使用
      const nutritionRatios = [
        nutrition.protein[1], // たんぱく質の割合
        nutrition.fat[1], // 脂質の割合
        nutrition.carbohydrates[1], // 炭水化物の割合
        nutrition.calories[1], // カロリーの割合
        nutrition.iron[1], // 鉄分の割合
      ];
      console.log(nutritionRatios);
      const difference = nutritionRatios.reduce(
        (acc, value, index) => acc + Math.abs(value - colors[index]),
        0
      );
      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestFood = index;
      }
    });
    console.log("最も近い食品:", closestFood);
    const food = foodData[closestFood];
    console.log(food);
    const nutrition = food.nutrition;
    const pairing = food.pairing;

    // HTMLに内容を設定
    closeshow.innerHTML = `
      この栄養成分に一番近い食べ物：${food.food} <br>
      ${food.food}の栄養成分は：<br>
      - たんぱく質: ${nutrition.protein[0]}g <br>
      - 脂質: ${nutrition.fat[0]}g <br>
      - 炭水化物: ${nutrition.carbohydrates[0] / 10}g <br>
      - カロリー: ${nutrition.calories[0] * 10}kcal <br>
      - 鉄分: ${nutrition.iron[0] / 20}mg <br>
      ${food.food}は：${food.description}<br>
      「${food.recommended_time}」の時間に食べたら一番いい。<br><br>
      ${food.food}は${pairing.food}と一緒に食べるといい。<br>
      ${pairing.food}の栄養成分は：<br>
      - たんぱく質: ${pairing.nutrition.protein[0]}g <br>
      - 脂質: ${pairing.nutrition.fat[0]}g <br>
      - 炭水化物: ${pairing.nutrition.carbohydrates[0] / 10}g <br>
      - カロリー: ${pairing.nutrition.calories[0] * 10}kcal <br>
      - 鉄分: ${pairing.nutrition.iron[0] / 20}mg <br>
      この二つの物を一緒にいい理由は：${pairing.reason}<br>
    `;
    return data;
  } catch (error) {
    console.error("JSON読み込みエラー:", error);
  }
}

/**
 * 1.5秒ごとに撮影のコード
 */
function toggleAutoPhotoShoot() {
  const shootButton = document.querySelector("#shoot");
  if (autoPhotoInterval) {
    stopAutoPhotoShoot(); // 停止
    shootButton.innerHTML = "Start "; // ボタンのテキスト変更
    initPhoto();
  } else {
    startAutoPhotoShoot(); // 開始
    shootButton.innerHTML = "stop"; // ボタンのテキスト変更
    // キャンバスをクリア
  }
}
function startAutoPhotoShoot() {
  photoShoot();
  autoPhotoInterval = setInterval(photoShoot, 505000); // 1秒ごとに撮影
}
function stopAutoPhotoShoot() {
  clearInterval(autoPhotoInterval);
  autoPhotoInterval = null; // 状態をリセット
}
/**
 * ビデオのカメラ設定(デバイスのカメラ映像をビデオに表示)
 */
function initVideoCamera() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((e) => console.log(e));
}

/**
 * 写真の初期描画
 */
function initPhoto() {
  canvas.width = video.clientWidth;
  canvas.height = video.clientHeight;
  const context = canvas.getContext("2d");
  context.fillStyle = "#AAA";
  context.fillRect(0, 0, canvas.width, canvas.height);
  document.querySelector("#photo").src = canvas.toDataURL("image/png");
}

/**
 * 写真の撮影描画
 */
function photoShoot() {
  totalCount = 0;
  let drawSize = calcDrawSize();
  canvas.width = drawSize.width;
  canvas.height = drawSize.height;
  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  document.querySelector("#photo").src = canvas.toDataURL("image/png");
  processFrame(context);
}

/**
 *フレームを処理して色認識する
 */
function processFrame(x) {
  const imageData = x.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  // 色認識（赤色を例とする）
  let redCount = 0;
  let purpleCount = 0;
  let greenCount = 0;
  let yellowCount = 0;
  let blueCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; // 赤
    const g = data[i + 1]; // 緑
    const b = data[i + 2]; // 青
    const { h } = rgb2hsv(r, g, b); //hsvに転換
    if (h < 0) {
      return;
    }
    // 赤色の条件
    if ((h >= 0 && h < 25) || (h >= 315 && h < 360)) {
      // 赤色
      redCount++;
    }

    // 黄色の条件
    if (h >= 25 && h < 95) {
      // 黄色
      yellowCount++;
    }

    // 緑色の条件
    if (h >= 95 && h < 165) {
      // 緑色
      greenCount++;
    }

    // 青色の条件
    if (h >= 165 && h < 245) {
      // 青色
      blueCount++;
    }

    // 紫色の条件
    if (h >= 245 && h < 315) {
      // 紫色
      purpleCount++;
    }
  }

  // 結果を出力
  const totalPixels = canvas.width * canvas.height;
  const redPercentage = ((redCount / totalCount) * 100).toFixed(2);
  const bluePercentage = ((blueCount / totalCount) * 100).toFixed(2);
  const purplePercentage = ((purpleCount / totalCount) * 100).toFixed(2);
  const yellowPercentage = ((yellowCount / totalCount) * 100).toFixed(2);
  const greenPercentage = ((greenCount / totalCount) * 100).toFixed(2);
  outputred.innerHTML = `Red Percentage: ${redPercentage}%`;
  outputgreen.innerHTML = `green Percentage: ${greenPercentage}%`;
  outputblue.innerHTML = `blue Percentage: ${bluePercentage}%`;
  outputpurple.innerHTML = `purple Percentage: ${purplePercentage}%`;
  outputyellow.innerHTML = `yellow Percentage: ${yellowPercentage}%`;
  let colors = [
    redPercentage,
    yellowPercentage,
    greenPercentage,
    bluePercentage,
    purplePercentage,
  ];

  updateChart(colors);
  fetchData(colors);
}

//radarchart
// function updateChart(data) {
//   const ctx = document.getElementById("colorChart").getContext("2d");

//   if (colorChart) {
//     // 既存チャートを更新
//     colorChart.data.datasets[0].data = data;
//     colorChart.update();
//   } else {
//     console.log(data);
//     // 新しいチャートを作成
//     colorChart = new Chart(ctx, {
//       type: "radar", // チャートの種類（例: 'bar', 'pie', 'line'）
//       data: {
//         labels: ["たんぱく質", "脂質", "炭水化物", "カロリー", "鉄分"], // ラベル
//         datasets: [
//           {
//             // label: "今取得したものの割合",

//             data: data, // 各データ（割合）
//             backgroundColor: "rgba(255, 204, 0, 0.8)",
//             pointBackgroundColor: "rgba(255, 99, 132, 1)",
//           },
//         ],
//       },
//       options: {
//         animation: {
//           easing: "easeInQuad", // イージング関数を文字列で指定
//           duration: 1000, // アニメーションの時間（ミリ秒）
//         },
//         scales: {
//           r: {
//             ticks: {
//               stepSize: 20,
//               display: false, // スケールの数値を非表示
//             },
//             grid: {
//               color: "rgba(0, 0, 0, 0.2)", // グリッド線を薄い灰色に
//             },
//             angleLines: {
//               display: true, // 軸線はそのまま表示
//             },
//             suggestedMin: -10, // 最小値（スケールの開始値）
//             suggestedMax: 80, // 最大値（スケールの終了値）
//           },
//         },
//         responsive: false,
//         plugins: {
//           legend: {
//             display: false,
//           },
//           title: {
//             display: true,
//             text: "今取得した栄養構成は:",
//           },
//         },
//       },
//       plugins: [
//         {
//           id: "customLabels",
//           afterDatasetDraw(chart) {
//             const { ctx, scales } = chart;
//             const dataset = chart.data.datasets[0];
//             console.log(dataset);
//             dataset.data.reverse(); // 配列の順番を逆にする
//             console.log(dataset);
//             const centerX = chart.chartArea.width / 2 + chart.chartArea.left; // 中心X座標
//             const centerY = chart.chartArea.height / 2 + chart.chartArea.top; // 中心Y座標

//             dataset.data.forEach((value, index) => {
//               const angle =
//                 Math.PI / 2 + (2 * Math.PI * index) / dataset.data.length;
//               const radius = scales.r.getDistanceFromCenterForValue(value);
//               const x = centerX + Math.cos(angle) * radius; // 中心からのX位置
//               const y = centerY - Math.sin(angle) * radius; // 中心からのY位置

//               ctx.save();
//               ctx.fillStyle = "black"; // 数値の色
//               ctx.font = "12px Arial"; // フォント設定
//               ctx.textAlign = "center";
//               ctx.fillText(value, x, y - 10); // 数値を頂点付近に表示
//               ctx.restore();
//             });
//           },
//         },
//       ],
//     });
//   }
// }

function updateChart(data) {
  const ctx = document.getElementById("colorChart").getContext("2d");

  if (colorChart) {
    // 既存チャートを更新
    colorChart.data.datasets[0].data = data;
    colorChart.update();
  } else {
    // 新しいチャートを作成
    colorChart = new Chart(ctx, {
      type: "pie", // チャートの種類（例: 'bar', 'pie', 'line'）
      data: {
        labels: ["たんぱく質", "脂質", "炭水化物", "カロリー", "鉄分"], // ラベル
        datasets: [
          {
            label: "今取得したものの割合",
            data: data, // 各データ（割合）
            backgroundColor: [
              "#FF0000",
              "#FFFF00",
              "#00FF00",
              "#0000FF",
              "#800080",
            ], // 色
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: true,
            text: "今取得した栄養割合は:",
          },
        },
      },
    });
  }
}

/**
 * 描画サイズの計算
 * 縦横比が撮影(video)が大きい時は撮影の縦基準、それ以外は撮影の横基準で計算
 */
function calcDrawSize() {
  let videoRatio = video.videoHeight / video.videoWidth;
  let viewRatio = video.clientHeight / video.clientWidth;
  return videoRatio > viewRatio
    ? { height: video.clientHeight, width: video.clientHeight / videoRatio }
    : { height: video.clientWidth * videoRatio, width: video.clientWidth };
}

//RGB値をHSV値に変換する(0～360//0-1//0-1)
function rgb2hsv(r, g, b) {
  // 引数処理
  let tmp = [r, g, b];
  if (r !== void 0 && g === void 0) {
    const cc = parseInt(
      r
        .toString()
        .replace(/[^\da-f]/gi, "")
        .replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3"),
      16
    );
    tmp = [(cc >> 16) & 0xff, (cc >> 8) & 0xff, cc & 0xff];
  } else {
    for (let i in tmp) tmp[i] = Math.max(0, Math.min(255, Math.floor(tmp[i])));
  }
  [r, g, b] = tmp;

  // RGB to HSV 変換
  const v = Math.max(r, g, b),
    d = v - Math.min(r, g, b),
    s = v ? d / v : 0,
    a = [r, g, b, r, g],
    i = a.indexOf(v),
    h = s ? (((a[i + 1] - a[i + 2]) / d + i * 2 + 6) % 6) * 60 : 0;

  // 戻り値
  if (v > 0.5 && s > 0.5) {
    totalCount++;
    return { h };
  } else {
    return -1;
  }

  //v > 0.5 s
}
