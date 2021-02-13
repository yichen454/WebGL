import React from 'react'
import Hammer from 'hammerjs'
import { Delaunay } from '../../utils/Delaunay'
import GUIThree from '../../utils/GUIThree'

class FaceMaskUtil extends React.PureComponent {

    params = {
        '手动绘制': false,
        '三角面': true,
        '序号': true,
        '参考': true,
        '下载顶点索引': () => {
            SaveTxt("face.txt", this.triangles.toString());
        },
        '下载UV': () => {
            SaveTxt("uv.txt", this.uv.toString());
        },
        '下载示意图': () => {
            downLoad("示意图.png", this.canvas.toDataURL("image/png"));
        },
    }

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        let _this = this;
        let canvas = this.canvas;
        let ctx = canvas.getContext("2d");

        let qrv = getQrv();

        let vertices = [];
        let img = new Image();
        img.src = './textures/face_mask.png';
        img.onload = () => {
            _this.draw(ctx, canvas, img, qrv, vertices);
        }

        this.game_hammer = new Hammer(this.canvas);
        this.game_hammer.on("tap", function (e) {
            console.log(e.center);
            if (!_this.params["手动绘制"]) {
                return;
            }
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            vertices.push([e.center.x, e.center.y]);
            _this.draw(ctx, canvas, img, qrv, vertices);
        });

        let folder = GUIThree.getGUI().addFolder("人脸索引 UV导出（PC查阅，左脸为准）");
        folder.add(this.params, "手动绘制").onChange((e) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            qrv = e ? [] : getQrv();
            _this.draw(ctx, canvas, img, qrv, vertices);
        })
        folder.add(this.params, "参考").onChange((e) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            _this.draw(ctx, canvas, img, qrv, vertices);
        })

        folder.add(this.params, "序号").onChange((e) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            _this.draw(ctx, canvas, img, qrv, vertices);
        })

        folder.add(this.params, "三角面").onChange((e) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            _this.draw(ctx, canvas, img, qrv, vertices);
        })
        folder.add(this.params, "下载顶点索引");
        folder.add(this.params, "下载UV");
        folder.add(this.params, "下载示意图");
    }


    draw(ctx, canvas, img, qrv, vertices) {
        if (this.params["手动绘制"]) {
            qrv = [];
        } else {
            vertices = [];
        }

        if (this.params['参考']) {
            ctx.fillStyle = "#cccccc";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        for (let i = 0; i < qrv.length; i++) {
            let x = qrv[i][0];
            let y = qrv[i][1];
            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'red';
            ctx.arc(x, y, 1, 0, Math.PI * 2, false)
            ctx.closePath();
            ctx.stroke();

            if (this.params['序号']) {
                ctx.font = "10px";
                ctx.fillStyle = "#0000DD";
                ctx.fillText(i, x + 2, y);
            }
        }

        for (let i = 0; i < vertices.length; i++) {
            let x = vertices[i][0];
            let y = vertices[i][1];
            ctx.beginPath();
            ctx.lineWidth = 4;
            ctx.strokeStyle = 'green';
            ctx.arc(x, y, 1, 0, Math.PI * 2, false)
            ctx.closePath();
            ctx.stroke();

            ctx.font = "10px";
            ctx.fillStyle = "#000000";
            ctx.fillText(" (" + x + "," + y + ")", x + 2, y);
        }

        if (this.params['三角面']) {

            vertices.forEach(element => {
                qrv.push(element);
            });
            console.time("triangulate");
            var triangles = Delaunay(qrv);
            console.timeEnd("triangulate");
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'blue';
            for (let i = triangles.length; i;) {
                ctx.beginPath();
                --i; ctx.moveTo(qrv[triangles[i]][0], qrv[triangles[i]][1]);
                --i; ctx.lineTo(qrv[triangles[i]][0], qrv[triangles[i]][1]);
                --i; ctx.lineTo(qrv[triangles[i]][0], qrv[triangles[i]][1]);
                ctx.closePath();
                ctx.stroke();
            }
        }
        this.triangles = triangles;
        let uv = [];
        qrv.forEach(element => {
            uv.push([element[0] / 612, 1 - element[1] / 806])
        });
        this.uv = uv;
        this.canvas = canvas;
    }

    downLoadFace() {

    }

    componentWillUnmount() {
        this.game_hammer.destroy();
    }


    render() {
        return (
            <div className="fs" style={{ backgroundColor: 'green' }}>
                <canvas ref={(canvas) => { this.canvas = canvas }} width={612} height={806}></canvas>
            </div>
        )
    }
}

export default FaceMaskUtil

function getQrv() {

    let w = 612;
    let h = 806;

    let qrv = [];
    qrv.push([30, 350]);//0
    qrv.push([30, 392]);//1
    qrv.push([33, 435]);//2
    qrv.push([37, 477]);//3
    qrv.push([44, 521]);//4
    qrv.push([52, 561]);//5
    qrv.push([63, 606]);//6
    qrv.push([79, 646]);//7
    qrv.push([99, 682]);//8
    qrv.push([122, 710]);//9
    qrv.push([145, 735]);//10
    qrv.push([171, 754]);//11
    qrv.push([197, 775]);//12
    qrv.push([223, 794]);//13
    qrv.push([255, 800]);//14
    qrv.push([283, 802]);//15

    qrv.push([w / 2, 803]);//16

    for (let i = 0; i <= 15; i++) {
        let index = 15 - i;
        qrv.push(gp(index));//17-32
    }

    qrv.push([63, 300]);//33
    qrv.push([103, 285]);//34
    qrv.push([149, 282]);//35
    qrv.push([190, 288]);//36
    qrv.push([219, 298]);//37

    for (let i = 1; i <= 5; i++) {
        let index = 38 - i;
        qrv.push(gp(index));//38-42
    }

    qrv.push([306, 354]);//43
    qrv.push([306, 412]);//44
    qrv.push([306, 471]);//45
    qrv.push([306, 536]);//46

    qrv.push([265, 579]);//47
    qrv.push([291, 578]);//48
    qrv.push([306, 583]);//49
    qrv.push([w - qrv[48][0], qrv[48][1]]);//50
    qrv.push([w - qrv[47][0], qrv[47][1]]);//51

    qrv.push([110, 362]);//52
    qrv.push([142, 338]);//53
    qrv.push([200, 338]);//54
    qrv.push([228, 368]);//55
    qrv.push([196, 374]);//56
    qrv.push([141, 378]);//57

    qrv.push(gp(55));//58
    qrv.push(gp(54));//59
    qrv.push(gp(53));//60
    qrv.push(gp(52));//61
    qrv.push(gp(57));//62
    qrv.push(gp(56));//63


    qrv.push([97, 308]);//64
    qrv.push([140, 312]);//65
    qrv.push([180, 314]);//66
    qrv.push([220, 321]);//67

    for (let i = 1; i <= 4; i++) {
        let index = 68 - i;
        qrv.push(gp(index));//68-71
    }


    qrv.push([172, 329]);//72
    qrv.push([171, 380]);//73
    qrv.push([167, 358]);//74

    for (let i = 1; i <= 3; i++) {
        let index = 71 + i;
        qrv.push(gp(index));//75-77
    }


    qrv.push([277, 370]);//78
    qrv.push(gp(78));//79
    qrv.push([254, 506]);//80
    qrv.push(gp(80));//81
    qrv.push([234, 548]);//82
    qrv.push(gp(82));//83

    qrv.push([200, 645]);//84
    qrv.push([234, 635]);//85
    qrv.push([278, 629]);//86
    qrv.push([306, 638]);//87
    qrv.push(gp(86));//88
    qrv.push(gp(85));//89
    qrv.push(gp(84));//90

    qrv.push([380, 683]);//91
    qrv.push([344, 701]);//92
    qrv.push([306, 710]);//93
    qrv.push(gp(92));//94
    qrv.push(gp(91));//95


    qrv.push([584, 302]);//96
    qrv.push([573, 245]);//97
    qrv.push([553, 196]);//98
    qrv.push([528, 153]);//99
    qrv.push([502, 120]);//100
    qrv.push([469, 93]);//101
    qrv.push([436, 71]);//102
    qrv.push([401, 49]);//103
    qrv.push([359, 34]);//104
    qrv.push([304, 24]);//105

    for (let i = 1; i <= 9; i++) {
        let index = 105 - i;
        qrv.push(gp(index));
    }

    function gp(index) {
        return [w - qrv[index][0], qrv[index][1]]
    }
    return qrv;
}

function SaveTxt(FileName, Content) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(Content));
    element.setAttribute('download', FileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function downLoad(name, url) {
    var oA = document.createElement("a");
    oA.download = name;// 设置下载的文件名，默认是'下载'
    oA.href = url;
    document.body.appendChild(oA);
    oA.click();
    oA.remove(); // 下载之后把创建的元素删除
}