interface CommonModelData extends ModelData {
  color: string;
}

interface RangeSliderModelData extends ModelData {
  common: CommonModelData;
  input: InputModelData;
  track: TrackModelData;
  scale: ScaleModelData;
}

interface RangeSliderProps extends ViewProps {
  windowResizeHandler: EventListener;
}
