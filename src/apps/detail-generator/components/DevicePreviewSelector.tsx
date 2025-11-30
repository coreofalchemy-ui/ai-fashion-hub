import React from 'react';

export type DeviceType = 'iphone16' | 'iphone16pro' | 'iphone16promax';

interface DeviceConfig {
  name: string;
  width: number;
  height: number;
}

export const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  iphone16: {
    name: 'iPhone 16',
    width: 393,
    height: 852,
  },
  iphone16pro: {
    name: 'iPhone 16 Pro',
    width: 402,
    height: 874,
  },
  iphone16promax: {
    name: 'iPhone 16 Pro Max',
    width: 440,
    height: 956,
  },
};

interface DevicePreviewSelectorProps {
  selectedDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
}

export const DevicePreviewSelector: React.FC<DevicePreviewSelectorProps> = ({
  selectedDevice,
  onDeviceChange,
}) => {
  return (
    <div className="device-preview-selector">
      <div className="selector-label">미리보기 디바이스</div>
      <div className="device-buttons">
        {(Object.keys(DEVICE_CONFIGS) as DeviceType[]).map((deviceKey) => {
          const device = DEVICE_CONFIGS[deviceKey];
          const isSelected = selectedDevice === deviceKey;
          return (
            <button
              key={deviceKey}
              className={`device-button ${isSelected ? 'selected' : ''}`}
              onClick={() => onDeviceChange(deviceKey)}
            >
              <div className="device-icon">📱</div>
              <div className="device-name">{device.name}</div>
              <div className="device-size">{device.width}px</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
