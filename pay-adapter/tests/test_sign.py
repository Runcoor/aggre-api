"""签名算法测试 — 确保与 go-epay 的 GenerateParams 完全一致。"""

from app.sign import epay_sign, hupi_sign


def test_epay_sign_basic():
    """基本签名：按 key 排序，过滤 sign/sign_type/空值，拼接 key 取 MD5。"""
    params = {
        "pid": "1001",
        "type": "alipay",
        "out_trade_no": "USR1NO123456",
        "notify_url": "https://example.com/notify",
        "name": "TUC100",
        "money": "10.00",
        "device": "pc",
        "sign_type": "MD5",
        "return_url": "https://example.com/return",
        "sign": "",
    }
    key = "testkey123"

    sign = epay_sign(params, key)

    # 手动计算：
    # 过滤 sign(空), sign_type → 剩余 7 个字段
    # 排序: device, money, name, notify_url, out_trade_no, pid, return_url, type
    # url_str = "device=pc&money=10.00&name=TUC100&notify_url=https://example.com/notify&out_trade_no=USR1NO123456&pid=1001&return_url=https://example.com/return&type=alipay"
    # md5(url_str + key)
    import hashlib
    expected_str = "device=pc&money=10.00&name=TUC100&notify_url=https://example.com/notify&out_trade_no=USR1NO123456&pid=1001&return_url=https://example.com/return&type=alipay" + key
    expected = hashlib.md5(expected_str.encode()).hexdigest()
    assert sign == expected


def test_epay_sign_filters_empty():
    """空值字段应被过滤。"""
    params = {
        "pid": "1001",
        "type": "alipay",
        "out_trade_no": "ORDER1",
        "empty_field": "",
        "none_field": None,
        "money": "1.00",
        "sign": "old_sign",
        "sign_type": "MD5",
    }
    key = "key"

    sign = epay_sign(params, key)

    import hashlib
    expected_str = "money=1.00&out_trade_no=ORDER1&pid=1001&type=alipay" + key
    expected = hashlib.md5(expected_str.encode()).hexdigest()
    assert sign == expected


def test_hupi_sign_basic():
    """虎皮椒签名：过滤 hash，其余逻辑与易支付类似。"""
    params = {
        "appid": "app123",
        "trade_order_id": "ORDER1",
        "total_fee": "10.00",
        "hash": "old_hash",
    }
    secret = "secret"

    sign = hupi_sign(params, secret)

    import hashlib
    expected_str = "appid=app123&total_fee=10.00&trade_order_id=ORDER1" + secret
    expected = hashlib.md5(expected_str.encode()).hexdigest()
    assert sign == expected
