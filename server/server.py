import argparse
import random
import socket
import time

import flask
from flask import jsonify, request


def find_available_port():
    """利用可能なポートを探す関数"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("localhost", 0))  # ランダムなポートをバインド
    _, port = sock.getsockname()  # バインドされたポートを取得
    sock.close()
    return port


app = flask.Flask(__name__)
app.config["DEBUG"] = False


def fake_setup(port):
    print(f"status:::ポート確保済み:{port}", flush=True)
    print("status:::初期化中", flush=True)
    time.sleep(random.random() * 10)
    print("status:::データ取得中", flush=True)
    time.sleep(random.random() * 10)
    print("status:::パラメータ設定中", flush=True)
    time.sleep(random.random() * 10)
    print("status:::完了", flush=True)


@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,HEAD,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    return response


@app.route("/healthcheck", methods=["GET"])
def health_check():
    return jsonify("ok")


@app.route("/quit", methods=["GET"])
def quit():
    import sys

    sys.exit(0)


@app.route("/", methods=["GET"])
def root():
    return jsonify("ok")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    port = find_available_port()
    fake_setup(port)
    app.run(port=port)
