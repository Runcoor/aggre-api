import hashlib


def epay_sign(params: dict[str, str], key: str) -> str:
    """易支付签名：过滤 sign/sign_type 和空值，按 key 排序，拼接后加 key，取 MD5。

    与 go-epay 库的 GenerateParams 完全一致。
    """
    filtered = {
        k: v
        for k, v in params.items()
        if k not in ("sign", "sign_type") and v != "" and v is not None
    }
    sorted_items = sorted(filtered.items())
    url_str = "&".join(f"{k}={v}" for k, v in sorted_items)
    return hashlib.md5((url_str + key).encode()).hexdigest()


def hupi_sign(params: dict[str, str], appsecret: str) -> str:
    """虎皮椒签名：过滤 hash 和空值，按 key 排序，拼接后加 appsecret，取 MD5。"""
    filtered = {
        k: v
        for k, v in params.items()
        if k != "hash" and v != "" and v is not None
    }
    sorted_items = sorted(filtered.items())
    url_str = "&".join(f"{k}={v}" for k, v in sorted_items)
    return hashlib.md5((url_str + appsecret).encode()).hexdigest()
