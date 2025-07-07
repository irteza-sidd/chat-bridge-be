import Channel from "../models/Channel.js";
import Broadcast from "../models/Broadcast.js";
import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import { io, usersio } from "../socket.js";

export const createChannel = async (req, res) => {
  try {
    const newChannel = new Channel({
      channelName: req.body.name,
    });
    await newChannel.save();

    return res.status(201).json({
      success: true,
      message: "Channel created successfully",
      data: newChannel,
    });
  } catch (err) {
    console.error("Error creating channel:", err);
    return res.status(500).json({ success: false, message: err });
  }
};

export const allChannels = async (req, res) => {
  try {
    const allChannel = await Channel.find({});

    return res.status(201).json({
      success: true,
      message: "Channel fetched successfully",
      data: allChannel,
    });
  } catch (err) {
    console.error("Error fetching all channel:", err);
    return res.status(500).json({ success: false, message: err });
  }
};

export const createBroadcast = async (req, res) => {
  const email = req.user.email;
  const { sendTo, file, departId } = req.body;
  const token = req.headers.authorization;

  if (!sendTo) {
    return res.status(400).json({ error: "Send to must be selected" });
  }
  try {
    const config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${process.env.GATEWAY}/hr/employee/fetch-employee-emails?status=${sendTo}&departId=${departId}`,
      headers: {
        Authorization: `${token}`,
      },
    };

    const response = await axios.request(config);
    const recipients = response?.data?.data;

    let recipientEmails = [];
    for (let i = 0; i < recipients?.length; i++) {
      recipientEmails.push(recipients[i].email);
    }

    const body = {
      ...req.body,
      attachment: {
        name: file?.originalname,
        location: file?.location,
        key: file?.key,
      },
      recipentEmail: recipientEmails,
      sentBy: email,
      status: "active",
    };

    const newBroadcast = new Broadcast(body);
    await newBroadcast.save();

    for (let i = 0; i < newBroadcast.recipentEmail.length; i++) {
      const socketId = usersio[newBroadcast.recipentEmail[i]];
      if (socketId) {
        io.to(socketId).emit("new-broadcast", newBroadcast);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Broadcast created successfully",
      data: newBroadcast,
    });
  } catch (err) {
    console.error("Error creating broadcast:", err);
    return res.status(500).json({ success: false, message: err });
  }
};

export const getBroadcasts = async (req, res) => {
  try {
    const search = req.query.search;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    let query = {};

    if (search != null && search != "undefined" && search.trim().length > 0) {
      query.sentBy = { $regex: new RegExp(search, "i") };
    }

    const allBroadcastCount = await Broadcast.countDocuments(query);
    const allBroadcast = await Broadcast.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(201).json({
      success: true,
      message: "Broadcast fetched successfully",
      data: allBroadcast,
      pagination: {
        totalRecords: allBroadcastCount,
        totalPages: Math.ceil(allBroadcastCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (err) {
    console.error("Error fetching all broadcast:", err);
    return res.status(500).json({ success: false, message: err });
  }
};

export const getUserBroadcasts = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const broadcasts = await Broadcast.aggregate([
      {
        $match: {
          recipentEmail: userEmail,
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "channelId",
          foreignField: "_id",
          as: "channel",
        },
      },
      {
        $unwind: "$channel",
      },
      {
        $group: {
          _id: "$channel._id",
          channelName: { $first: "$channel.channelName" },
          sendTo: { $first: "$channel.sendTo" },
          broadcasts: {
            $push: {
              _id: "$_id",
              title: "$title",
              message: "$message",
              messageType: "$messageType",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          channelName: 1,
          sendTo: 1,
          broadcasts: 1,
        },
      },
    ]);

    return res.status(201).json({
      success: true,
      message: "User broadcast fetched successfully",
      data: broadcasts,
    });
  } catch (err) {
    console.error("Error fetching user broadcast:", err);
    return res.status(500).json({ success: false, message: err });
  }
};

export const getChannelsWithUserEmail = async (req, res) => {
  const email = req.user.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const result = await Broadcast.aggregate([
      {
        $match: {
          recipentEmail: email,
        },
      },
      {
        $lookup: {
          from: "channels",
          localField: "channelId",
          foreignField: "_id",
          as: "channel",
        },
      },
      {
        $unwind: "$channel",
      },
      {
        $group: {
          _id: "$channel._id",
          channelName: { $first: "$channel.channelName" },
          sendTo: { $first: "$channel.sendTo" },
          broadcasts: {
            $push: {
              _id: "$_id",
              title: "$title",
              message: "$message",
              messageType: "$messageType",
              createdAt: "$createdAt",
            },
          },
        },
      },
      {
        $addFields: {
          totalBroadcasts: { $size: "$broadcasts" },
          // paginatedBroadcasts: {
          //   $slice: ["$broadcasts", skip, limit],
          // },
        },
      },
      {
        $project: {
          _id: 1,
          channelName: 1,
          sendTo: email,
          totalBroadcasts: 1,
          // broadcasts: "$paginatedBroadcasts",
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "User channels fetched successfully",
      channels: result,
      // pagination: {
      //   currentPage: page,
      //   perPage: limit,
      // },
    });
  } catch (error) {
    console.error("Error fetching channels with email:", error);
    res.status(500).json({ message: error });
  }
};

export const getBroadcastsByChannelAndEmail = async (req, res) => {
  const { channelId } = req.params;
  const email = req.user.email;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid channel ID" });
  }

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  try {
    const broadcastsCount = await Broadcast.countDocuments({
      channelId,
      recipentEmail: { $in: [email] },
    });

    const broadcasts = await Broadcast.find({
      channelId,
      recipentEmail: { $in: [email] },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("title message messageType attachment createdAt");

    return res.status(200).json({
      success: true,
      message: "Filtered broadcasts fetched successfully",
      data: broadcasts,
      pagination: {
        totalDocs: broadcastsCount,
        totalPages: Math.ceil(broadcastsCount / limit),
        currentPage: page,
        perPage: limit,
        hasNextPage: page * limit < broadcastsCount,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    return res.status(500).json({ success: false, message: error });
  }
};
