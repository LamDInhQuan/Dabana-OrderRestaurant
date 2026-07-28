package com.dabana.backend.modules.subscription.service;

import com.dabana.backend.modules.subscription.dto.request.PayosConfigRequest;
import com.dabana.backend.modules.subscription.dto.response.PayosConfigResponse;

public interface IPayosConfigService {

    /** Tra ve cau hinh hien tai (co the null neu chua ai cau hinh lan nao). */
    PayosConfigResponse getConfig();

    /** Tao moi hoac cap nhat cau hinh (chi 1 dong duy nhat cho toan he thong). */
    PayosConfigResponse saveConfig(PayosConfigRequest request);
}
