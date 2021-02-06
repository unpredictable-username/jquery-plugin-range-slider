interface TrackModelData extends ModelData {
  leftOffset: string;
  rightOffset: string;
}

interface TrackProps extends ViewProps {
  progressProps: TrackProgressProps;
}

interface TrackProgressProps extends ViewProps {
  leftOffset: string;
  rightOffset: string;
  color: string;
}