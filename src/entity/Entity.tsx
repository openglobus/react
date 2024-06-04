import * as React from "react";
import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {useGlobusContext} from '../index';
import {
    Billboard as GlobusBillboard,
    Entity as GlobusEntity,
    GeoObject as GlobusGeoObject,
    LonLat
} from '@openglobus/og';
import type {IEntityParams} from "@openglobus/og/lib/js/entity/Entity";
import {VectorContext} from "../layer/Vector";
import {EventCallback} from "@openglobus/og/lib/js/Events";
import {NumberArray3} from "@openglobus/og/lib/js/math/Vec3";
import {Billboard, GeoObject} from "./index";

type EntityChildElement = React.ReactElement< typeof Billboard | typeof GeoObject >;

export interface EntityParams extends IEntityParams {
    children?: EntityChildElement,
    visibility?: boolean,
    lon: number,
    lat: number,
    alt: number,
    onDraw?: EventCallback
}

const Entity: React.FC<EntityParams> = ({visibility, lon, lat, alt, lonlat, name, children, ...rest}) => {
    const {globus} = useGlobusContext();
    const {
        addEntity,
        removeEntity,
        addBillboard,
        removeBillboard,
        addGeoObject,
        removeGeoObject
    } = useContext(VectorContext);
    const entityRef = useRef<GlobusEntity | null>(null);
    const [billboard, setBillboard] = useState<GlobusBillboard | null>(null);
    const [geoObject, setGeoObject] = useState<GlobusGeoObject | null>(null);

    useEffect(() => {
        if (lonlat) {
            if (!(lonlat instanceof LonLat)) lonlat = LonLat.createFromArray(lonlat as NumberArray3);
            entityRef.current?.setLonLat(lonlat);
        }
    }, [lonlat, billboard]);

    useEffect(() => {
        if (name) entityRef.current?.setLonLat2(lon, lat, alt);
    }, [lon, lat, alt]);

    useEffect(() => {
        if (typeof visibility === 'boolean' && entityRef.current) {
            entityRef.current?.setVisibility(visibility);
        }
    }, [visibility]);

    useEffect(() => {
        if (globus) {
            entityRef.current = new GlobusEntity({
                lonlat, name, ...rest
            });
            addEntity(entityRef.current);

            return () => {
                if (globus && entityRef.current) {
                    removeEntity(entityRef.current);
                }
            };
        }
    }, [globus, addEntity, removeEntity]);

    useEffect(() => {
        if (billboard && !entityRef.current?.billboard) entityRef.current?.setBillboard(billboard);
    }, [billboard]);

    useEffect(() => {
        if (geoObject && !entityRef.current?.geoObject) entityRef.current?.setGeoObject(geoObject);
    }, [geoObject]);

    const addBillboardContext = useCallback((entity: GlobusBillboard) => {
        setBillboard(entity);
        if (entityRef.current) {
            addBillboard(entityRef.current, entity);
        }
    }, [addBillboard]);

    const removeBillboardContext = useCallback(() => {
        if (entityRef.current) {
            removeBillboard(entityRef.current);
        }
        setBillboard(null);
    }, [removeBillboard]);

    const addGeoObjectContext = useCallback((entity: GlobusGeoObject) => {
        setGeoObject(entity);
        if (entityRef.current) {
            addGeoObject(entityRef.current, entity);
        }
    }, [addGeoObject]);

    const removeGeoObjectContext = useCallback(() => {
        if (entityRef.current) {
            removeGeoObject(entityRef.current);
        }
        setGeoObject(null);
    }, [removeGeoObject]);

    return (
        <>
            {children &&  React.cloneElement(children, {
                _addBillboard: addBillboardContext,
                _removeBillboard: removeBillboardContext,
                _addGeoObject: addGeoObjectContext,
                _removeGeoObject: removeGeoObjectContext
            })}
        </>
    );
};

export {Entity};
