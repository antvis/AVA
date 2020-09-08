import { FlowFunction } from '../utils';
import { G2PlotConfigs } from '../interface';

/**
 * spec.encoding -> config.channelConfigs (geometry)
 */
export const encoding: FlowFunction<Partial<G2PlotConfigs>> = (spec, tmpCfgs) => {
  // @ts-ignore
  const { encoding } = spec;

  tmpCfgs.channelConfigs = {
    xField: encoding.x.field,
    yField: encoding.y.field,
  };
  return Promise.resolve(tmpCfgs);
};
